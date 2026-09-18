#[derive(Debug, Clone)]
pub struct AudioBuffer {
    data: Vec<f32>,
    abs_start: usize,
    max_len: usize,
}

impl AudioBuffer {
    pub fn new(max_len: usize) -> Self {
        assert!(max_len > 0, "audio buffer capacity must be positive");
        AudioBuffer {
            data: Vec::with_capacity(max_len),
            abs_start: 0,
            max_len,
        }
    }

    pub fn append(&mut self, samples: &[f32]) {
        self.data.extend_from_slice(samples);
        self.trim();
    }

    fn trim(&mut self) {
        if self.data.len() > self.max_len {
            let excess = self.data.len() - self.max_len;
            self.data.drain(..excess);
            self.abs_start += excess;
        }
    }

    pub fn abs_len(&self) -> usize {
        self.abs_start + self.data.len()
    }

    #[allow(dead_code)]
    pub fn len(&self) -> usize {
        self.data.len()
    }

    #[allow(dead_code)]
    pub fn is_empty(&self) -> bool {
        self.data.is_empty()
    }

    #[allow(dead_code)]
    pub fn max_len(&self) -> usize {
        self.max_len
    }

    pub fn read_window(&self, start_abs: usize, end_abs: usize) -> Vec<f32> {
        let start = start_abs.max(self.abs_start);
        let end = end_abs.min(self.abs_start + self.data.len());
        if start >= end {
            return Vec::new();
        }
        self.data[(start - self.abs_start)..(end - self.abs_start)].to_vec()
    }

    pub fn clear(&mut self) {
        self.data.clear();
        self.abs_start = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn appends_and_reads_back() {
        let mut buffer = AudioBuffer::new(100);
        buffer.append(&[1.0, 2.0, 3.0]);
        assert_eq!(buffer.len(), 3);
        assert_eq!(buffer.abs_len(), 3);
        assert_eq!(buffer.read_window(0, 3), vec![1.0, 2.0, 3.0]);
    }

    #[test]
    fn rolling_window_returns_latest() {
        let mut buffer = AudioBuffer::new(4);
        buffer.append(&[1.0, 2.0]);
        buffer.append(&[3.0, 4.0]);
        buffer.append(&[5.0]);
        assert_eq!(buffer.len(), 4);
        assert_eq!(buffer.abs_len(), 5);
        assert_eq!(buffer.read_window(1, 5), vec![2.0, 3.0, 4.0, 5.0]);
    }

    #[test]
    fn window_size_is_bounded() {
        let mut buffer = AudioBuffer::new(16);
        for i in 0..100u32 {
            buffer.append(&[i as f32]);
        }
        assert_eq!(buffer.max_len(), 16);
        assert_eq!(buffer.len(), 16);
        assert_eq!(buffer.abs_len(), 100);
    }

    #[test]
    fn read_window_clamps_out_of_range() {
        let mut buffer = AudioBuffer::new(16);
        buffer.append(&[1.0, 2.0, 3.0]);
        assert!(buffer.read_window(10, 20).is_empty());
        assert_eq!(buffer.read_window(1, 99), vec![2.0, 3.0]);
    }

    #[test]
    fn clear_resets_state() {
        let mut buffer = AudioBuffer::new(16);
        buffer.append(&[1.0, 2.0, 3.0]);
        buffer.clear();
        assert!(buffer.is_empty());
        assert_eq!(buffer.abs_len(), 0);
    }

    #[test]
    fn trims_and_tracks_absolute_positions() {
        let mut buffer = AudioBuffer::new(3);
        buffer.append(&[1.0, 2.0, 3.0]);
        buffer.append(&[4.0]);
        assert_eq!(buffer.abs_len(), 4);
        assert_eq!(buffer.read_window(1, 4), vec![2.0, 3.0, 4.0]);
    }
}
