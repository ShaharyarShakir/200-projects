# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

uType is a local, privacy-focused, real-time speech-to-text dictation application for Linux (Rust 2024 edition). It captures audio via CPAL/ALSA, resamples to 16 kHz mono f32, feeds rolling windows to a local Whisper GGML model via `whisper-rs`, stabilizes hypotheses in real time, and renders live output in an in-place ANSI terminal UI.

## Common Development Commands

### Building and Linting
- **Build (release):** `cargo build --release` *(first build compiles `whisper.cpp` via CMake)*
- **Type-check:** `cargo check`
- **Format code:** `cargo fmt`
- **Check formatting:** `cargo fmt --check`
- **Clippy:** `cargo clippy --all-targets -- -D warnings`

### Testing
- **Run all unit tests:** `cargo test`
- **Run a single test:** `cargo test <test_name>` (e.g. `cargo test audio::buffer::tests::appends_and_reads_back`)
- **Run tests for a specific module:** `cargo test transcription::stable` or `cargo test vad::energy`

### Running the App
- **Run with Whisper model:** `cargo run --release -- --model <path_to_ggml_model>`
- **Run pipeline test without a model (Echo backend):** `cargo run --release -- --backend echo`
- **Run with debug diagnostics:** `UTYPE_DEBUG=1 cargo run --release -- --backend echo` (or `--debug`)
- **List input devices:** `cargo run --release -- --list-devices`

## High-Level Architecture & Concurrency

uType operates as a multi-threaded pipeline with decoupled stages connected by bounded queues and channels:

```
ALSA / CPAL Callback         Audio Processor Thread         STT Worker Thread                UI Thread
┌────────────────────┐  raw  ┌──────────────────────┐ f32   ┌─────────────────────────┐ event ┌─────────────┐
│ cpal audio stream  ├──────►│ byte → f32 conversion├──────►│ AudioBuffer (abs coords)├──────►│ TerminalUi  │
│ RawAudioQueue (raw)│ queue │ mono downmix         │ chan  │ RollingWindow (anchored)│ chan  │ ANSI redraw │
└────────────────────┘ drop- │ rubato sinc resampler│       │ EnergyVad               │       └─────────────┘
                       oldest└──────────────────────┘       │ WhisperBackend / Echo   │
                                                            │ HypothesisTracker (LCP) │
                                                            └─────────────────────────┘
```

### 1. Audio Capture (`src/audio/capture.rs`)
- CPAL stream callback performs only minimal raw byte copy into `RawAudioQueue` (bounded `Mutex + VecDeque + Condvar`).
- Drops oldest chunks if full to ensure real-time latency and prevent blocking the audio driver thread. Tracks `dropped_chunks` counter.

### 2. Audio Processing (`src/audio/processor.rs`, `src/audio/format.rs`)
- Drains raw audio chunks from `RawAudioQueue`.
- Normalizes integer/float formats (`I8`-`I64`, `U8`-`U64`, `F32`, `F64`) to `[-1.0, 1.0]` f32 and averages multi-channel input down to mono.
- Resamples audio from hardware sample rate to 16 kHz using `rubato` async sinc resampler (sinc length 64, cutoff 0.95, oversampling 32, cubic interpolation, Blackman-Harris 2).
- Emits `ProcessedChunk` over an unbounded channel to maintain a gapless audio timeline for inference.

### 3. STT Worker (`src/app/controller.rs`, `src/transcription/`, `src/vad/`, `src/stt/`)
- **Rolling Audio Buffer (`src/audio/buffer.rs`):** Tracks audio using absolute sample positions (`abs_len`, `abs_start`) so window slices survive front-trimming.
- **Anchored Rolling Window (`src/transcription/window.rs`):** Advances inference windows by step size (`window_ms - overlap_ms`), allowing early partial inference once `min_audio_ms` is reached.
- **VAD (`src/vad/energy.rs`):** Frame RMS energy detector (default threshold `0.0025`). Silence timer starts only *after* speech has been detected to avoid finalizing on ambient silence. Triggers utterance finalization and resets rolling window/buffer.
- **Hypothesis Stabilization (`src/transcription/stable.rs`):** `HypothesisTracker` tokenizes and normalizes hypotheses, comparing normalized tokens with previous hypotheses via Longest Common Prefix (LCP). Words require 2 consecutive confirmations to commit. Committed text is monotonic (never rewritten); the remaining tail is displayed as partial text.
- **Speech-to-Text Backends (`src/stt/`):**
  - `WhisperBackend`: Uses `whisper-rs` (CPU greedy single segment, `no_context`, temperature `0.0`, blank suppression). Fresh `WhisperState` per inference.
  - `EchoBackend`: Returns `[speech]` when window RMS exceeds VAD threshold, allowing end-to-end verification without model files.

### 4. UI Thread (`src/ui/terminal.rs`)
- Batches incoming `UiEvent`s (`View`, `Diagnostics`, `Finalized`) over a 100 ms receive timeout.
- Performs in-place ANSI terminal updates (`\x1b[1A\x1b[2K`) displaying status (Idle/Listening/Inferring), committed text, partial text, recent finalized history, and optional debug telemetry.

## Key Traits

- `SpeechToText` (`src/stt/mod.rs`): Abstract interface for transcription engines (`transcribe(&mut self, audio: &[f32], sample_rate: u32) -> Result<TranscriptionResult>`).
- `Vad` (`src/vad/mod.rs`): Audio frame voice activity detector (`feed(&mut self, samples: &[f32]) -> VadFeedback`, `reset(&mut self)`).
- `Ui` (`src/ui/mod.rs`): Renderer interface for transcription views and diagnostic snapshots.

## Configuration System (`src/config/settings.rs`)

Configuration is layered without external CLI parser dependencies (no `clap`):
1. **Hardcoded defaults** (`16 kHz`, `2000 ms` window, `300 ms` interval, `500 ms` min audio, `700 ms` silence timeout, `0.0025` RMS threshold, 4 threads, `en` language).
2. **Environment variables** (`UTYPE_*`, e.g. `UTYPE_MODEL_PATH`, `UTYPE_BACKEND`, `UTYPE_DEBUG`).
3. **CLI arguments** (`--model`, `--backend`, `--device`, `--threads`, `--debug`, etc.).

All time settings are converted to sample counts based on the target sample rate (16 kHz).
