# uType Phase 1C — implementation report

## Scope delivered

Real-time, fully-local speech-to-text dictation pipeline: **microphone → 16 kHz mono f32 → rolling
audio buffer → local English Whisper → stable live transcription → terminal UI**.

Repository: `08__desktop-apps/utype` · Language: Rust (edition 2024) · Rust toolchain: 1.98.1.

## Stack

| Concern | Choice |
|---|---|
| Microphone capture | cpal 0.18.2 (ALSA host, tested with `HDA Intel PCH, CX11880 Analog`, 48 kHz / stereo / f32) |
| Resampling 48k/44.1k → 16k | rubato 5.0.0 async sinc resampler + audioadapter-buffers 5.2.0 |
| Speech-to-text | whisper-rs 0.16.0 → whisper.cpp (ggml), CPU only (`use_gpu(false)`) |
| Configuration | hand-rolled: defaults → `UTYPE_*` env → CLI flags (no clap dep) |
| Logging | log + env_logger (`--debug` / `UTYPE_DEBUG` → `debug` level + whisper logs) |
| Errors | anyhow at boundaries, typed `UtError` at module edges |

## Modules

| Module | File(s) | Role | Tests |
|---|---|---|---|
| error | `src/error.rs` | Typed errors (`Config/Audio/UnsupportedFormat/Stt`) | — |
| config | `src/config/` | Layered config + validation | indirect via usage |
| audio | `src/audio/format.rs` | Byte → f32 for all formats, mono downmix, clamping | 4 |
| audio | `src/audio/buffer.rs` | Rolling buffer w/ absolute coordinates | 6 |
| audio | `src/audio/processor.rs` | rubato sinc resample, byte→f32→mono pipeline | 3 |
| audio | `src/audio/capture.rs` | Device open, raw-timeout-safe drop-oldest queue | — |
| transcription | `src/transcription/window.rs` | Anchored rolling window | 5 |
| transcription | `src/transcription/stable.rs` | LCP word stabilizer (committed/partial) | 10 |
| transcription | `src/transcription/state.rs` | Session state machine + finalize | 5 |
| vad | `src/vad/energy.rs` | Energy VAD, utterance-end only after speech | 6 |
| stt | `src/stt/whisper.rs` | whisper-rs backend | — |
| stt | `src/stt/mod.rs` | `[speech]` test backend (EchoBackend) | — |
| diagnostics | `src/diagnostics.rs` | Window/latency/drop telemetry snapshot | — |
| ui | `src/ui/terminal.rs` | In-place ANSI UI | — |
| app | `src/app/controller.rs` | Threads + event loop | — |
| main | `src/main.rs` | Entry, help, list-devices | — |

Total: **44 passing unit tests**.

## Key design decisions

1. **No cloud, no model in repo** — models (`*.bin/*.gguf/*.onnx`) are gitignored; the user supplies
   them (`--model` or `UTYPE_MODEL_PATH`). `--backend echo` exercises the whole pipeline without one.
2. **Capture callback stays trivial** — raw bytes only. Conversion/downmix/resample run on the
   processor thread; the bounded drop-oldest queue prevents the ALSA callback from ever stalling and
   reports `dropped_chunks` in diagnostics.
3. **Gapless audio for windowing** — the processor → STT channel is unbounded and ordered; windows
   are anchored to absolute sample positions, so partial early windows are still correct after trim.
4. **Never gate quiet audio** — the VAD threshold (0.0025 RMS) is deliberately low and only decides
   *when to finalize* an utterance, never what reaches Whisper.
5. **2-consecutive-confirmation commit** — first hypothesis commits nothing; committed text grows
   only from repeated words and is never rewritten.
6. **Resampler defaults validated** — sinc 64/0.95/32×/cubic/BlackmanHarris2 chosen for 8 kHz
   speech bandwidth; sanity-tested that quiet audio survives resampling intact.

## Configuration surface

Defaults → `UTYPE_*` env vars → CLI flags (`--model --backend --device --language --threads
--sample-rate --window-ms --interval-ms --min-audio-ms --overlap-ms --stability
--silence-timeout-ms --rms-threshold --debug --list-devices --help`). Full table in `README.md`.

## Verification performed

```
cargo fmt --check           ✓ clean
cargo check                 ✓ clean
cargo test                  ✓ 44 passed, 0 failed
cargo clippy --all-targets -- -D warnings   ✓ clean
cargo build --release       ✓ (whisper.cpp compiled via CMake on first build)
```

Runtime (physical mic, `--backend echo` on the release binary):

- `--list-devices` enumerates the ALSA devices.
- Capture opens at 48 kHz / stereo / f32 and processes to 16 kHz mono f32.
- State machine observed in a live run: `Listening → Inferring → Listening [speech] partial →
  Idle` (VAD finalize fired). ANSI in-place rendering, hypothesis cadence (~300 ms) and committal
  behavior all verified.
- Bad model path fails fast with exit code 1 and a clear error.

## Known limitations (Phase 1C)

- English-only; no punctuation/formatting control; no wake word; no discard gesture.
- Invalid/missing model must come from the user (no auto-download by design).
- ALSA XRUN warnings may appear on some hosts (logged at debug; the drop-oldest queue absorbs
  them). Capture device `"HDA Intel PCH, CX11880 Analog"` worked on the test machine.
- Stabilizer commit anchor is word-count based: a divergent tail inside committed word count is
  swallowed (see `doc/implementation-notes.md`).
- Terminal UI is ANSI in-place text — no cursor/curses backends yet.

## Suggested next steps

Backend model evaluation (tiny/base/medium) on a recorded clip, then Phase 2 concerns: wake word,
threaded/multi-segment Whisper frontend, formatting control, quality-of-service UI, model
auto-download UI.