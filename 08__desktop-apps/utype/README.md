# uType

Local, privacy-focused, real-time speech-to-text dictation for Linux. Everything runs on your machine — no cloud, no audio leaves the device.

- microphone → 16 kHz mono f32 → rolling audio buffer → local Whisper → stable live transcription → terminal UI.

## Requirements

- Arch Linux (or any Linux with ALSA) plus a working input device
- cmake + clang (used to build whisper.cpp and generate bindings)
- Rust 1.98+

System packages (Arch):

```sh
sudo pacman -S --needed cmake clang
```

Tip: run `utype --list-devices` to see the exact device name if your default input is wrong.

## Model setup

uType does not bundle or download models. Download an English whisper ggml model from the
[whisper.cpp releases](https://github.com/ggml-org/whisper.cpp/releases) and place it somewhere,
for example:

```sh
mkdir -p models
# e.g. put ggml-base.bin (or ggml-tiny.bin for a faster, lower-quality model) into models/
```

Point `--model models/ggml-base.bin` or `UTYPE_MODEL_PATH=...` at it when running.

## Build

```sh
cargo build --release
```

The first build compiles whisper.cpp (via cmake) and can take several minutes.

## Run

Fastest / smallest model:

```sh
cargo run --release -- --model models/ggml-tiny.bin
```

Better accuracy:

```sh
cargo run --release -- --model models/ggml-base.bin --threads 4
```

With debug diagnostics (window, latency, dropped chunks, whisper logs):

```sh
UTYPE_DEBUG=1 cargo run --release -- --model models/ggml-base.bin
```

Help and input device listing:

```sh
cargo run --release -- --help
cargo run --release -- --list-devices
```

### Testing the pipeline without a model

The `echo` backend returns `[speech]` whenever audio energy is above the VAD threshold, so you can
validate capture, resampling, windowing, and the UI without downloading a model:

```sh
cargo run --release -- --backend echo
```

## Configuration

Defaults → `UTYPE_*` environment variables → command-line flags.

| Setting | Flag | Env var | Default |
|---|---|---|---|
| Model path | `--model` | `UTYPE_MODEL_PATH` | — (required for whisper backend) |
| Backend | `--backend` | `UTYPE_BACKEND` | `whisper` |
| Input device | `--device` | `UTYPE_DEVICE` | system default |
| Language | `--language` | `UTYPE_LANGUAGE` | `en` |
| Whisper threads | `--threads` | `UTYPE_THREADS` | `4` |
| Target sample rate | `--sample-rate` | `UTYPE_SAMPLE_RATE` | `16000` |
| Inference window | `--window-ms` | `UTYPE_WINDOW_MS` | `2000` |
| Inference interval | `--interval-ms` | `UTYPE_INTERVAL_MS` | `300` |
| Min audio for first inference | `--min-audio-ms` | `UTYPE_MIN_AUDIO_MS` | `500` |
| Window overlap | `--overlap-ms` | `UTYPE_OVERLAP_MS` | window − interval |
| Stability confirmations | `--stability` | `UTYPE_STABILITY` | `2` |
| Silence timeout | `--silence-timeout-ms` | `UTYPE_SILENCE_TIMEOUT_MS` | `700` |
| VAD RMS threshold | `--rms-threshold` | `UTYPE_RMS_THRESHOLD` | `0.0025` |
| Energy frame size | — | `UTYPE_ENERGY_FRAME_MS` | `20` |
| Capture chunk | — | `UTYPE_CAPTURE_CHUNK_MS` | `10` |
| Resample chunk | — | `UTYPE_RESAMPLE_CHUNK_MS` | `20` |
| Debug diagnostics | `--debug` | `UTYPE_DEBUG` | off |

## Architecture

```
┌────────────┐  raw bytes  ┌───────────────┐  16k mono ┌────────────────┐
│ ALSA/CPAL  │ ──────────► │ audio         │ ─────────►│ STT worker     │
│ callback   │ drop-oldest │ processor     │  f32      │ buffer+window  │
└────────────┘   queue     │ (resample)    │ chunks    │ VAD+stabilizer │
                           └───────────────┘           │ whisper-rs     │
                                                        └───────┬────────┘
      ┌──────────────────────────────────────────────────── UI  events ┘
      ▼
┌────────────┐
│ UI thread  │  in-place ANSI: status, partial, committed, finalized
└────────────┘
```

- ALSA/CPAL callback thread: copies raw bytes into a bounded drop-oldest queue; no heavy work.
- Audio processor thread: byte → f32, downmix to mono, rubato sinc resample to 16 kHz.
- STT worker thread: rolling sum buffer, anchored rolling inference window, energy VAD, stabilizer,
  whisper-rs backend. Sends UI events.
- UI thread: in-place ANSI redraw of status, partial text, committed text, finalized lines,
  optional debug diagnostics.

Components are behind small traits (`SpeechToText`, `Vad`, `Ui`) so backends, VADs, and UIs can be
swapped without touching the pipeline.

## Docs

- `doc/implementation-notes.md` — module-by-module design notes (why each piece exists).
- `doc/phase1c-report.md` — implementation report for the phase.

## Develop

```sh
cargo fmt
cargo check
cargo test        # format/downmix, buffer, rolling window, stabilizer, VAD, state tests
cargo clippy --all-targets -- -D warnings
```

## Known limitations (Phase 1C)

- English only (Whisper `en` model).
- No punctuation/formatting control, no wake word, no way to discard a partial utterance.
- VAD is energy-based; a single threaded backend for now (a full xcompiled / multithreaded frontend
  is a later phase).
- Blank (`<no speech>`) hypotheses are ignored by the stabilizer.
- Terminal UI is ANSI in-place; full-screen/curses UX and a system tray are later phases.
