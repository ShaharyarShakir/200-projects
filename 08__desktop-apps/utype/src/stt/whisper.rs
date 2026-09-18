use std::path::Path;
use std::time::Instant;

use whisper_rs::{FullParams, SamplingStrategy, WhisperContext, WhisperContextParameters};

use super::{SpeechToText, TranscriptionResult};
use crate::error::UtError;

pub struct WhisperBackend {
    ctx: WhisperContext,
    n_threads: i32,
    language: Option<String>,
}

impl WhisperBackend {
    pub fn new(
        model_path: &Path,
        n_threads: i32,
        language: Option<String>,
    ) -> anyhow::Result<Self> {
        let mut params = WhisperContextParameters::new();
        params.use_gpu(false);
        let ctx = WhisperContext::new_with_params(model_path, params).map_err(|err| {
            UtError::Stt(format!(
                "failed to load model '{}': {err}",
                model_path.display()
            ))
        })?;
        Ok(WhisperBackend {
            ctx,
            n_threads,
            language,
        })
    }
}

impl SpeechToText for WhisperBackend {
    fn transcribe(
        &mut self,
        audio: &[f32],
        _sample_rate: u32,
    ) -> anyhow::Result<TranscriptionResult> {
        let mut params = FullParams::new(SamplingStrategy::Greedy { best_of: 1 });
        params.set_n_threads(self.n_threads);
        params.set_language(self.language.as_deref());
        params.set_no_timestamps(true);
        params.set_single_segment(true);
        params.set_no_context(true);
        params.set_print_progress(false);
        params.set_print_special(false);
        params.set_print_realtime(false);
        params.set_print_timestamps(false);
        params.set_suppress_blank(true);
        params.set_temperature(0.0);

        let t0 = Instant::now();
        let mut state = self
            .ctx
            .create_state()
            .map_err(|err| UtError::Stt(format!("failed to create whisper state: {err}")))?;
        state
            .full(params, audio)
            .map_err(|err| UtError::Stt(format!("whisper inference failed: {err}")))?;
        let duration_ms = t0.elapsed().as_millis();

        let n_segments = state.full_n_segments();
        let mut parts: Vec<String> = Vec::new();
        for i in 0..n_segments {
            if let Some(segment) = state.get_segment(i) {
                let text = segment
                    .to_str_lossy()
                    .map(|cow| cow.trim().to_string())
                    .unwrap_or_default();
                if !text.is_empty() {
                    parts.push(text);
                }
            }
        }
        let text = parts.join(" ");

        Ok(TranscriptionResult {
            text,
            inference_ms: duration_ms,
        })
    }
}
