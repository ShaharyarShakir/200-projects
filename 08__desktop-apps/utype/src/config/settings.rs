use std::path::PathBuf;

use crate::error::UtError;

const DEFAULT_SAMPLE_RATE: u32 = 16_000;
const DEFAULT_INFERENCE_WINDOW_MS: u64 = 2_000;
const DEFAULT_INFERENCE_INTERVAL_MS: u64 = 300;
const DEFAULT_MINIMUM_AUDIO_MS: u64 = 500;
const DEFAULT_STABILITY_CONFIRMATIONS: usize = 2;
const DEFAULT_SILENCE_TIMEOUT_MS: u64 = 700;
const DEFAULT_SILENCE_RMS_THRESHOLD: f32 = 0.0025;
const DEFAULT_ENERGY_FRAME_MS: u64 = 20;
const DEFAULT_CAPTURE_CHUNK_MS: u64 = 10;
const DEFAULT_RESAMPLE_CHUNK_MS: u64 = 20;
const DEFAULT_WHISPER_THREADS: i32 = 4;

#[derive(Debug, Clone)]
pub struct Config {
    pub model_path: Option<PathBuf>,
    pub sample_rate: u32,
    pub inference_window_ms: u64,
    pub inference_interval_ms: u64,
    pub minimum_audio_ms: u64,
    pub overlap_ms: Option<u64>,
    pub stability_confirmations: usize,
    pub silence_timeout_ms: u64,
    pub silence_rms_threshold: f32,
    pub energy_frame_ms: u64,
    pub capture_chunk_ms: u64,
    pub resample_chunk_ms: u64,
    pub whisper_threads: i32,
    pub language: Option<String>,
    pub device: Option<String>,
    pub backend: String,
    pub debug: bool,
}

impl Config {
    fn defaults() -> Self {
        Config {
            model_path: None,
            sample_rate: DEFAULT_SAMPLE_RATE,
            inference_window_ms: DEFAULT_INFERENCE_WINDOW_MS,
            inference_interval_ms: DEFAULT_INFERENCE_INTERVAL_MS,
            minimum_audio_ms: DEFAULT_MINIMUM_AUDIO_MS,
            overlap_ms: None,
            stability_confirmations: DEFAULT_STABILITY_CONFIRMATIONS,
            silence_timeout_ms: DEFAULT_SILENCE_TIMEOUT_MS,
            silence_rms_threshold: DEFAULT_SILENCE_RMS_THRESHOLD,
            energy_frame_ms: DEFAULT_ENERGY_FRAME_MS,
            capture_chunk_ms: DEFAULT_CAPTURE_CHUNK_MS,
            resample_chunk_ms: DEFAULT_RESAMPLE_CHUNK_MS,
            whisper_threads: DEFAULT_WHISPER_THREADS,
            language: Some("en".to_string()),
            device: None,
            backend: "whisper".to_string(),
            debug: false,
        }
    }

    pub fn load() -> anyhow::Result<Config> {
        let mut config = Config::defaults();
        config.apply_env()?;
        config.apply_args()?;
        config.validate()?;
        Ok(config)
    }

    fn apply_env(&mut self) -> anyhow::Result<()> {
        if let Some(value) = env_bool("UTYPE_DEBUG") {
            self.debug = value;
        }
        if let Some(value) = env_string("UTYPE_MODEL_PATH") {
            self.model_path = Some(PathBuf::from(value));
        }
        if let Some(value) = env_string("UTYPE_DEVICE") {
            self.device = Some(value);
        }
        if let Some(value) = env_string("UTYPE_BACKEND") {
            self.backend = value;
        }
        if let Some(value) = env_string("UTYPE_LANGUAGE") {
            self.language = Some(value);
        }
        if let Some(value) = env_u64("UTYPE_SAMPLE_RATE")? {
            self.sample_rate = value as u32;
        }
        if let Some(value) = env_u64("UTYPE_WINDOW_MS")? {
            self.inference_window_ms = value;
        }
        if let Some(value) = env_u64("UTYPE_INTERVAL_MS")? {
            self.inference_interval_ms = value;
        }
        if let Some(value) = env_u64("UTYPE_MIN_AUDIO_MS")? {
            self.minimum_audio_ms = value;
        }
        if let Some(value) = env_u64("UTYPE_OVERLAP_MS")? {
            self.overlap_ms = Some(value);
        }
        if let Some(value) = env_usize("UTYPE_STABILITY")? {
            self.stability_confirmations = value;
        }
        if let Some(value) = env_u64("UTYPE_SILENCE_TIMEOUT_MS")? {
            self.silence_timeout_ms = value;
        }
        if let Some(value) = env_f32("UTYPE_RMS_THRESHOLD")? {
            self.silence_rms_threshold = value;
        }
        if let Some(value) = env_u64("UTYPE_ENERGY_FRAME_MS")? {
            self.energy_frame_ms = value;
        }
        if let Some(value) = env_u64("UTYPE_CAPTURE_CHUNK_MS")? {
            self.capture_chunk_ms = value;
        }
        if let Some(value) = env_u64("UTYPE_RESAMPLE_CHUNK_MS")? {
            self.resample_chunk_ms = value;
        }
        if let Some(value) = env_i32("UTYPE_THREADS")? {
            self.whisper_threads = value;
        }
        Ok(())
    }

    fn apply_args(&mut self) -> anyhow::Result<()> {
        let args = CliArgs::parse(std::env::args());
        if let Some(path) = args.get("--model") {
            self.model_path = Some(PathBuf::from(path));
        }
        if let Some(device) = args.get("--device") {
            self.device = Some(device.to_string());
        }
        if let Some(backend) = args.get("--backend") {
            self.backend = backend.to_string();
        }
        if let Some(language) = args.get("--language") {
            self.language = Some(language.to_string());
        }
        if args.has("--debug") {
            self.debug = true;
        }
        if let Some(value) = args.get("--sample-rate") {
            self.sample_rate = parse_u64("--sample-rate", value)? as u32;
        }
        if let Some(value) = args.get("--window-ms") {
            self.inference_window_ms = parse_u64("--window-ms", value)?;
        }
        if let Some(value) = args.get("--interval-ms") {
            self.inference_interval_ms = parse_u64("--interval-ms", value)?;
        }
        if let Some(value) = args.get("--min-audio-ms") {
            self.minimum_audio_ms = parse_u64("--min-audio-ms", value)?;
        }
        if let Some(value) = args.get("--overlap-ms") {
            self.overlap_ms = Some(parse_u64("--overlap-ms", value)?);
        }
        if let Some(value) = args.get("--stability") {
            self.stability_confirmations = parse_usize("--stability", value)?;
        }
        if let Some(value) = args.get("--silence-timeout-ms") {
            self.silence_timeout_ms = parse_u64("--silence-timeout-ms", value)?;
        }
        if let Some(value) = args.get("--rms-threshold") {
            self.silence_rms_threshold = parse_f32("--rms-threshold", value)?;
        }
        if let Some(value) = args.get("--threads") {
            self.whisper_threads = parse_i32("--threads", value)?;
        }
        Ok(())
    }

    fn validate(&self) -> anyhow::Result<()> {
        if self.sample_rate == 0 {
            return Err(UtError::Config("sample rate must be greater than zero".into()).into());
        }
        if self.inference_window_ms == 0 {
            return Err(
                UtError::Config("inference window must be greater than zero".into()).into(),
            );
        }
        if self.inference_interval_ms == 0 {
            return Err(
                UtError::Config("inference interval must be greater than zero".into()).into(),
            );
        }
        if self.minimum_audio_ms > self.inference_window_ms {
            return Err(UtError::Config(format!(
                "minimum audio ({}) must not exceed the inference window ({})",
                self.minimum_audio_ms, self.inference_window_ms
            ))
            .into());
        }
        if let Some(overlap) = self.overlap_ms {
            if overlap > self.inference_window_ms {
                return Err(UtError::Config(format!(
                    "overlap ({overlap}) must not exceed the inference window ({})",
                    self.inference_window_ms
                ))
                .into());
            }
        } else if self.inference_interval_ms >= self.inference_window_ms {
            return Err(UtError::Config(format!(
                "inference interval ({}) must be smaller than the inference window ({})",
                self.inference_interval_ms, self.inference_window_ms
            ))
            .into());
        }
        if self.stability_confirmations == 0 {
            return Err(
                UtError::Config("stability confirmations must be at least 1".into()).into(),
            );
        }
        if self.backend != "whisper" && self.backend != "echo" {
            return Err(UtError::Config(format!(
                "unknown backend '{}'; expected 'whisper' or 'echo'",
                self.backend
            ))
            .into());
        }
        if self.backend == "whisper" && self.model_path.is_none() {
            return Err(UtError::Config(
                "no model path configured; set UTYPE_MODEL_PATH or pass --model".into(),
            )
            .into());
        }
        Ok(())
    }

    pub fn overlap_ms(&self) -> u64 {
        self.overlap_ms.unwrap_or(
            self.inference_window_ms
                .saturating_sub(self.inference_interval_ms),
        )
    }

    pub fn advance_ms(&self) -> u64 {
        self.inference_window_ms.saturating_sub(self.overlap_ms())
    }

    fn ms_to_samples(&self, ms: u64) -> usize {
        (ms as u128 * self.sample_rate as u128 / 1000) as usize
    }

    pub fn window_samples(&self) -> usize {
        self.ms_to_samples(self.inference_window_ms)
    }

    pub fn advance_samples(&self) -> usize {
        self.ms_to_samples(self.advance_ms())
    }

    pub fn min_audio_samples(&self) -> usize {
        self.ms_to_samples(self.minimum_audio_ms)
    }

    pub fn silence_samples(&self) -> usize {
        self.ms_to_samples(self.silence_timeout_ms)
    }

    pub fn energy_frame_samples(&self) -> usize {
        (self.ms_to_samples(self.energy_frame_ms)).max(1)
    }

    pub fn silence_timeout_frames(&self) -> usize {
        (self.silence_samples() / self.energy_frame_samples()).max(1)
    }

    pub fn max_buffer_samples(&self) -> usize {
        self.window_samples() + self.advance_samples() * 3 + self.sample_rate as usize
    }
}

fn parse_u64(flag: &str, value: &str) -> anyhow::Result<u64> {
    value
        .parse::<u64>()
        .map_err(|_| UtError::Config(format!("invalid value '{value}' for {flag}")).into())
}

fn parse_i32(flag: &str, value: &str) -> anyhow::Result<i32> {
    value
        .parse::<i32>()
        .map_err(|_| UtError::Config(format!("invalid value '{value}' for {flag}")).into())
}

fn parse_usize(flag: &str, value: &str) -> anyhow::Result<usize> {
    value
        .parse::<usize>()
        .map_err(|_| UtError::Config(format!("invalid value '{value}' for {flag}")).into())
}

fn parse_f32(flag: &str, value: &str) -> anyhow::Result<f32> {
    value
        .parse::<f32>()
        .map_err(|_| UtError::Config(format!("invalid value '{value}' for {flag}")).into())
}

fn env_string(key: &str) -> Option<String> {
    std::env::var(key).ok().filter(|value| !value.is_empty())
}

fn env_u64(key: &str) -> anyhow::Result<Option<u64>> {
    match env_string(key) {
        Some(value) => Ok(Some(parse_u64(key, &value)?)),
        None => Ok(None),
    }
}

fn env_i32(key: &str) -> anyhow::Result<Option<i32>> {
    match env_string(key) {
        Some(value) => Ok(Some(parse_i32(key, &value)?)),
        None => Ok(None),
    }
}

fn env_usize(key: &str) -> anyhow::Result<Option<usize>> {
    match env_string(key) {
        Some(value) => Ok(Some(parse_usize(key, &value)?)),
        None => Ok(None),
    }
}

fn env_f32(key: &str) -> anyhow::Result<Option<f32>> {
    match env_string(key) {
        Some(value) => Ok(Some(parse_f32(key, &value)?)),
        None => Ok(None),
    }
}

fn env_bool(key: &str) -> Option<bool> {
    env_string(key).map(|value| {
        matches!(
            value.trim().to_lowercase().as_str(),
            "1" | "true" | "yes" | "on"
        )
    })
}

pub struct CliArgs {
    values: std::collections::HashMap<String, String>,
    pub help: bool,
    pub list_devices: bool,
}

impl CliArgs {
    pub fn parse(args: std::env::Args) -> Self {
        let mut values = std::collections::HashMap::new();
        let mut help = false;
        let mut list_devices = false;
        let mut args = args.skip(1).peekable();
        while let Some(arg) = args.next() {
            match arg.as_str() {
                "--help" | "-h" => help = true,
                "--list-devices" => list_devices = true,
                _ if arg.starts_with("--") => {
                    let key = arg.trim_start_matches("--").to_string();
                    let (key, inline) = match key.split_once('=') {
                        Some((key, value)) => (key.to_string(), Some(value.to_string())),
                        None => (key, None),
                    };
                    let value = match inline {
                        Some(value) => value,
                        None => args.next().unwrap_or_default(),
                    };
                    values.insert("--".to_string() + &key, value);
                }
                _ => {}
            }
        }
        CliArgs {
            values,
            help,
            list_devices,
        }
    }

    pub fn get(&self, key: &str) -> Option<&str> {
        self.values.get(key).map(|value| value.as_str())
    }

    pub fn has(&self, key: &str) -> bool {
        self.values.contains_key(key)
    }
}
