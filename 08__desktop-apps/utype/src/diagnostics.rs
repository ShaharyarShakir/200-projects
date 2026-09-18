#[derive(Debug, Clone, Default)]
pub struct DiagSnapshot {
    pub inference_count: u64,
    pub inference_ms: u128,
    pub inference_latency_ms: u128,
    pub accumulated_audio_ms: u128,
    pub window_start_ms: u128,
    pub window_end_ms: u128,
    pub window_len_ms: u128,
    pub buffer_abs_len: usize,
    pub dropped_chunks: u64,
}

impl DiagSnapshot {
    pub fn lines(&self) -> Vec<String> {
        let mut lines = Vec::new();
        lines.push(format!(
            "inference #{}: {}",
            self.inference_count, self.inference_ms
        ));
        lines.push(format!(
            "window: {}..{} ms (len {})",
            self.window_start_ms, self.window_end_ms, self.window_len_ms
        ));
        lines.push(format!("buffer: {} samples", self.buffer_abs_len));
        lines.push(format!(
            "accumulated audio: {} ms",
            self.accumulated_audio_ms
        ));
        lines.push(format!("latency: {} ms", self.inference_latency_ms));
        lines.push(format!("dropped chunks: {}", self.dropped_chunks));
        lines
    }
}
