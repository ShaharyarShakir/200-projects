# uType Phase 1C — implementation notes

Module-by-module design notes. Code is intentionally comment-free; this file documents why each
piece exists and how it fits together.

## Threads and data flow

```
ALSA callback thread           audio-processor thread          stt-worker thread               UI thread
┌─────────────────┐   queue   ┌─────────────────────┐  chan   ┌────────────────────────┐  chan  ┌─────────────┐
│ cpal callback   │ ────────► │ bytes → f32 → mono  │ ──────► │ AudioBuffer (rolling)  │ ─────► │ TerminalUi  │
│ memcpy → RawAudioQueue      │ rubato sinc → 16 kHz│  f32    │ RollingWindow          │ event │ ANSI redraw │
└─────────────────┘ drop-old  └─────────────────────┘ chunks  │ EnergyVad + session    │       └─────────────┘
                                                               │ WhisperBackend/Echo    │
                                                               └────────────────────────┘
```

- **Capture callback** does only a raw byte copy into `RawAudioQueue` (bounded, drop-oldest,
  `dropped_chunks` counter). It never converts or resamples — the ALSA callback must stay tiny.
- **Processor thread** drains the queue, converts bytes → f32, downmixes to mono, and resamples to
  16 kHz with rubato's async sinc resampler. Output chunks ride an *unbounded* ordered channel to
  the STT worker; nothing is dropped there because windowing needs a gapless audio timeline.
- `AudioBuffer` uses **absolute sample coordinates** (`abs_len`/`abs_start`), so windows survive
  buffer trimming. It never permanently deletes audio that a window may still need: trimming only
  happens past the buffer's max length.

## `config/settings.rs`

Layered config: defaults → `UTYPE_*` env vars → CLI flags. Kept dependency-free (no clap) to keep
startup fast and the memory footprint of the pipeline minimal. All time values are milliseconds
and converted to sample counts against the *target* sample rate (16 kHz), so tunables expressed in
milliseconds stay intuitive in the docs.

## `audio/format.rs`

Normalizes every integer sample format into float to a signed unit value with `clamp(-1.0, 1.0)`;
downmix averages channels. Covers `I8/U8/I16/U16/I32/U32/I64/U64/F32/F64` — matching everything
the ALSA host in cpal 0.18 can report.

## `audio/buffer.rs`

Rolling buffer with absolute positioning. `append` extends and trims the front.
`read_window(start_abs, end_abs)` clamps to what exists, so a window request that overlaps trimmed
audio simply returns a shorter window instead of failing.

## `audio/processor.rs`

Owns the rubato `Async` resampler and only pulls work when at least one resampler input block is
available, so samples accumulate in `mono_pending` without loss. Resampler parameters: sinc length
64, cutoff 0.95, oversampling 32, cubic interpolation, Blackman-Harris 2 window — a good balance
of quality and cost for speech (8 kHz bandwidth).

## `audio/capture.rs`

Opens the requested (or default) input device via cpal 0.18, resolves its `AudioSpec`, and builds a
stream for whichever `SampleFormat` is reported. `RawAudioQueue` (Mutex + VecDeque + Condvar)
guarantees drop-oldest with a bounded count and never blocks the capture callback for long. Device
listing (`--list-devices`) uses `Device::description().name()` — cpal 0.18 moved names there.

## `transcription/window.rs`

**Anchored** rolling windows: a window is always `(next_start, next_start + window_len)` and
`next_start` advances by `advance_len = window − overlap` after each emission. The *first* window
may fire early with `≥ min_len` audio so the UI shows a first partial quickly. `reset()` drops the
anchor so the next utterance starts from a fresh window.

## `transcription/stable.rs`

Word-level LCP tracker (`HypothesisTracker`) over consecutive hypotheses:

- `process(hypothesis)` tokenizes, normalizes (lowercase, strip punctuation), takes the LCP against
  the previous hypothesis, and commits only words that are repeated. Partial = the current tail.
- Committed text is **never rewritten**; it only ever grows by `max(old, lcp)`.
- First hypothesis commits nothing (nothing to confirm against).
- The `stable_prefix` helper is the pure function form used by tests.
- Limitation (documented): when a hypothesis diverges after committed words, the diverged tail that
  sits within the committed word count is swallowed — the commit anchor is word-count based, not
  string-based. Acceptable for Phase 1C.

## `transcription/state.rs`

`TranscriptionSession` owns a tracker plus the `Idle → Listening → Inferring` bookkeeping.
`finalize()` emits `committed + partial` as the final text, then resets. `reset()` is also used to
abort a bad utterance (e.g. VAD restart).

## `vad/energy.rs`

Frame-energy VAD that only *starts* timing silence after an utterance began, so ambient noise never
finalizes an idle session. `energy_frame_ms = 20 ms`, RMS threshold 0.0025 (low, so quiet speech is
not dropped). Feedback is `{speech, utterance_ended}`; `utterance_ended` triggers finalization and
the window/buffer/session reset in the STT worker.

## `stt/whisper.rs`

whisper-rs 0.16 wrapper. One `WhisperContext` (CPU, `use_gpu(false)`), a fresh `WhisperState` per
inference, `Greedy best_of 1`, `single_segment`, `no_context`, no timestamps, no prints, blank
suppression. `install_logging_hooks()` (enabled via the `log_backend` feature, gated behind
`--debug`) routes whisper.cpp logs into `log`.

## `stt/mod.rs` (`--backend echo`)

Test backend: returns `[speech]` when the window RMS is at/above the VAD threshold. Validates
capture → processor → windowing → UI with zero model dependency.

## `app/controller.rs`

- `run`: config → backend → capture → processor thread → STT worker → UI loop.
- `stt_worker`: owns buffer/window/VAD/session; on each chunk runs VAD; fires inference on the
  interval cadence when the session is active and new audio is available; finalizes on
  `utterance_ended`.
- UI loop batches events over a 100 ms receive window and renders one frame per batch.

## `ui/terminal.rs`

In-place ANSI redraw: `\x1b[1A\x1b[2K` up the previously drawn block, then re-emits. Tracks block
height so the erase is exact. `Finalized` feedback is kept as the last 3 lines for the user.