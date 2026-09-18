pub mod whisper;

use crate::error::UtError;

#[derive(Debug, Clone)]
pub struct TranscriptionResult {
    pub text: String,
    pub inference_ms: u128,
}

pub trait SpeechToText: Send {
    fn transcribe(
        &mut self,
        audio: &[f32],
        sample_rate: u32,
    ) -> anyhow::Result<TranscriptionResult>;
}

pub struct EchoBackend {
    rms_threshold: f32,
}

impl EchoBackend {
    pub fn new(rms_threshold: f32) -> Self {
        EchoBackend { rms_threshold }
    }
}

impl SpeechToText for EchoBackend {
    fn transcribe(
        &mut self,
        audio: &[f32],
        _sample_rate: u32,
    ) -> anyhow::Result<TranscriptionResult> {
        let rms = if audio.is_empty() {
            0.0
        } else {
            let sum: f64 = audio.iter().map(|s| (*s as f64) * (*s as f64)).sum();
            (sum / audio.len() as f64).sqrt() as f32
        };
        let text = if rms >= self.rms_threshold {
            "[speech]".to_string()
        } else {
            String::new()
        };
        Ok(TranscriptionResult {
            text,
            inference_ms: 0,
        })
    }
}

pub fn create_backend(config: &crate::config::Config) -> anyhow::Result<Box<dyn SpeechToText>> {
    match config.backend.as_str() {
        "whisper" => {
            let path = config.model_path.as_ref().ok_or_else(|| {
                UtError::Config(
                    "no model path configured; set UTYPE_MODEL_PATH or pass --model".into(),
                )
            })?;
            Ok(Box::new(whisper::WhisperBackend::new(
                path,
                config.whisper_threads,
                config.language.clone(),
            )?))
        }
        "echo" => Ok(Box::new(EchoBackend::new(config.silence_rms_threshold))),
        other => Err(UtError::Config(format!(
            "unknown backend '{other}'; expected 'whisper' or 'echo'"
        ))
        .into()),
    }
}
