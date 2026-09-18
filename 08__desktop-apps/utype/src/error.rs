use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum UtError {
    Config(String),
    Audio(String),
    UnsupportedFormat(String),
    Stt(String),
}

impl fmt::Display for UtError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            UtError::Config(msg) => write!(f, "configuration error: {msg}"),
            UtError::Audio(msg) => write!(f, "audio error: {msg}"),
            UtError::UnsupportedFormat(msg) => write!(f, "unsupported audio format: {msg}"),
            UtError::Stt(msg) => write!(f, "speech-to-text error: {msg}"),
        }
    }
}

impl Error for UtError {}
