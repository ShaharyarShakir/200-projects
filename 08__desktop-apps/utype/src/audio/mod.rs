pub mod buffer;
pub mod capture;
pub mod format;
pub mod processor;

use std::time::Instant;

pub use buffer::AudioBuffer;
pub use processor::AudioProcessor;

pub struct ProcessedChunk {
    pub samples: Vec<f32>,
    pub captured_at: Instant,
}
