use std::sync::Arc;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::mpsc::{self, Receiver, RecvTimeoutError, Sender};
use std::time::{Duration, Instant};

use crate::audio::capture::{AudioCapture, RawAudioQueue};
use crate::audio::{AudioBuffer, AudioProcessor, ProcessedChunk};
use crate::config::Config;
use crate::diagnostics::DiagSnapshot;
use crate::stt::{self, SpeechToText};
use crate::transcription::{RollingWindow, TranscriptionSession, TranscriptionView};
use crate::ui::Ui;
use crate::ui::UiEvent;
use crate::ui::terminal::TerminalUi;
use crate::vad::Vad;
use crate::vad::energy::EnergyVad;

const RAW_CHANNEL_CAPACITY: usize = 256;
const UI_TIMEOUT_MS: u64 = 100;

pub fn run(config: &Config) -> anyhow::Result<()> {
    let backend: Box<dyn SpeechToText> = stt::create_backend(config)?;
    let dropped_chunks = Arc::new(AtomicU64::new(0));

    let raw_queue = Arc::new(RawAudioQueue::new(
        RAW_CHANNEL_CAPACITY,
        dropped_chunks.clone(),
    ));
    let capture = AudioCapture::open(
        config.device.as_deref(),
        raw_queue.clone(),
        config.capture_chunk_ms,
    )?;

    log::info!(
        "capture device: {} | rate {} Hz | channels {} | format {}",
        capture.info.device_name,
        capture.info.spec.sample_rate,
        capture.info.spec.channels,
        capture.info.spec.format.as_str(),
    );

    let (processed_tx, processed_rx) = mpsc::channel::<ProcessedChunk>();
    let resample_chunk_frames =
        (capture.info.spec.sample_rate as usize / 1000).max(1) * config.resample_chunk_ms as usize;
    let processor =
        AudioProcessor::new(capture.info.spec, config.sample_rate, resample_chunk_frames)?;
    log::info!(
        "processing target: {} Hz mono f32",
        processor.target_spec().sample_rate
    );

    let (ui_tx, ui_rx) = mpsc::channel::<UiEvent>();

    let queue_for_processor = raw_queue.clone();
    let processor_thread = std::thread::Builder::new()
        .name("audio-processor".into())
        .spawn(move || processor_worker(processor, queue_for_processor, processed_tx))?;

    let stt_config = config.clone();
    let ui_tx_clone = ui_tx.clone();
    let stt_thread = std::thread::Builder::new()
        .name("stt-worker".into())
        .spawn(move || {
            let _ = stt_worker(
                stt_config,
                backend,
                processed_rx,
                ui_tx_clone,
                dropped_chunks,
            );
        })?;

    capture.play()?;

    let mut ui = TerminalUi::new();
    let mut final_text = String::new();
    let mut view: Option<TranscriptionView> = None;
    let mut diag: Option<DiagSnapshot> = None;

    loop {
        match ui_rx.recv_timeout(Duration::from_millis(UI_TIMEOUT_MS)) {
            Ok(UiEvent::View(new_view)) => {
                view = Some(new_view);
            }
            Ok(UiEvent::Diagnostics(new_diag)) => {
                diag = Some(new_diag);
            }
            Ok(UiEvent::Finalized(text)) => {
                final_text = text;
            }
            Err(RecvTimeoutError::Disconnected) => break,
            Err(RecvTimeoutError::Timeout) => {}
        }
        if let Some(ref current_view) = view {
            ui.render(
                current_view,
                if config.debug { diag.as_ref() } else { None },
                &final_text,
            );
            view = None;
            diag = None;
        }
    }

    log::info!("shutting down");
    drop(capture);
    raw_queue.close();
    drop(processor_thread);
    drop(stt_thread);
    Ok(())
}

fn processor_worker(
    mut processor: AudioProcessor,
    queue: Arc<RawAudioQueue>,
    tx: Sender<ProcessedChunk>,
) {
    while let Some(chunk) = queue.pop() {
        match processor.process(&chunk.bytes) {
            Ok(samples) if !samples.is_empty() => {
                if tx
                    .send(ProcessedChunk {
                        samples,
                        captured_at: chunk.captured_at,
                    })
                    .is_err()
                {
                    break;
                }
            }
            Ok(_) => {}
            Err(err) => log::warn!("audio processing failed: {err}"),
        }
    }
}

fn stt_worker(
    config: Config,
    mut backend: Box<dyn SpeechToText>,
    rx: Receiver<ProcessedChunk>,
    ui_tx: Sender<UiEvent>,
    dropped_chunks: Arc<AtomicU64>,
) -> anyhow::Result<()> {
    let mut buffer = AudioBuffer::new(config.max_buffer_samples());
    let mut window = RollingWindow::new(
        config.window_samples(),
        config.advance_samples(),
        config.min_audio_samples(),
    );
    let mut vad: Box<dyn Vad> = Box::new(EnergyVad::new(
        config.energy_frame_samples(),
        config.silence_rms_threshold,
        config.silence_timeout_frames(),
    ));

    let mut session = TranscriptionSession::new();

    let mut last_inference = Instant::now();
    let mut last_inference_end_abs = 0usize;
    let mut inference_count: u64 = 0;
    let mut last_captured_at = Instant::now();
    let mut accumulated_samples: usize = 0;

    loop {
        match rx.recv_timeout(Duration::from_millis(config.inference_interval_ms)) {
            Ok(chunk) => {
                last_captured_at = chunk.captured_at;
                accumulated_samples += chunk.samples.len();
                buffer.append(&chunk.samples);

                let feedback = vad.feed(&chunk.samples);
                if feedback.utterance_ended {
                    let ended = session.is_active();
                    let final_text = session.finalize();
                    window.reset();
                    buffer.clear();
                    last_inference_end_abs = 0;
                    vad.reset();
                    if let Some(text) = final_text {
                        log::info!("finalized: {text}");
                        let _ = ui_tx.send(UiEvent::Finalized(text.clone()));
                        let _ = ui_tx.send(UiEvent::View(session.view()));
                    } else if ended {
                        let _ = ui_tx.send(UiEvent::View(session.view()));
                    }
                } else if feedback.speech && !session.is_active() {
                    session.begin();
                    let _ = ui_tx.send(UiEvent::View(session.view()));
                }
            }
            Err(RecvTimeoutError::Timeout) => {}
            Err(RecvTimeoutError::Disconnected) => {
                break;
            }
        }

        if session.is_active()
            && last_inference.elapsed() >= Duration::from_millis(config.inference_interval_ms)
            && buffer.abs_len() > last_inference_end_abs
            && let Some((start, end)) = window.next_window(buffer.abs_len())
        {
            let samples = buffer.read_window(start, end);
            if samples.len() >= config.min_audio_samples() {
                session.note_inference_start();
                let _ = ui_tx.send(UiEvent::View(session.view()));
                let t0 = Instant::now();
                let result = backend.transcribe(&samples, config.sample_rate);
                let elapsed = t0.elapsed();
                match result {
                    Ok(transcription) => {
                        last_inference = Instant::now();
                        last_inference_end_abs = end;
                        inference_count += 1;
                        if !transcription.text.trim().is_empty() {
                            session.observe(&transcription.text);
                        }
                        let _ = ui_tx.send(UiEvent::View(session.view()));
                        let latency = last_captured_at.elapsed();
                        let dropped = dropped_chunks.load(Ordering::Relaxed);
                        let diag = DiagSnapshot {
                            inference_count,
                            inference_ms: elapsed.as_millis(),
                            inference_latency_ms: latency.as_millis(),
                            accumulated_audio_ms: (accumulated_samples as u128 * 1000)
                                / config.sample_rate as u128,
                            window_start_ms: (start as u128 * 1000) / config.sample_rate as u128,
                            window_end_ms: (end as u128 * 1000) / config.sample_rate as u128,
                            window_len_ms: ((end - start) as u128 * 1000)
                                / config.sample_rate as u128,
                            buffer_abs_len: buffer.abs_len(),
                            dropped_chunks: dropped,
                        };
                        log::debug!(
                            "hypothesis #{}: {:?} (inference {})",
                            inference_count,
                            transcription.text,
                            transcription.inference_ms
                        );
                        log::debug!("diag: {}", diag_summary(&diag));
                        let _ = ui_tx.send(UiEvent::Diagnostics(diag));
                    }
                    Err(err) => {
                        log::error!("STT inference failed: {err}");
                    }
                }
            }
        }
    }
    Ok(())
}

fn diag_summary(diag: &DiagSnapshot) -> String {
    diag.lines().join(" | ")
}

pub use crate::audio::capture::list_input_devices as list_devices;
