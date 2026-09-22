#[derive(Debug, Clone)]
pub struct RollingWindow {
    window_len: usize,
    advance_len: usize,
    min_len: usize,
    next_start: usize,
}

impl RollingWindow {
    pub fn new(window_len: usize, advance_len: usize, min_len: usize) -> Self {
        assert!(window_len > 0, "window length must be positive");
        assert!(advance_len > 0, "window advance must be positive");
        assert!(
            min_len <= window_len,
            "minimum length cannot exceed window length"
        );
        RollingWindow {
            window_len,
            advance_len,
            min_len,
            next_start: 0,
        }
    }

    #[allow(dead_code)]
    pub fn window_len(&self) -> usize {
        self.window_len
    }

    #[allow(dead_code)]
    pub fn advance_len(&self) -> usize {
        self.advance_len
    }

    #[allow(dead_code)]
    pub fn min_len(&self) -> usize {
        self.min_len
    }

    #[allow(dead_code)]
    pub fn next_start(&self) -> usize {
        self.next_start
    }

    #[allow(dead_code)]
    pub fn overlap_len(&self) -> usize {
        self.window_len.saturating_sub(self.advance_len)
    }

    pub fn next_window(&mut self, abs_len: usize) -> Option<(usize, usize)> {
        let start = self.next_start;
        let full_end = start + self.window_len;
        if abs_len >= full_end {
            self.next_start += self.advance_len;
            Some((start, full_end))
        } else if start == 0 && abs_len >= self.min_len {
            self.next_start += self.advance_len;
            Some((start, abs_len))
        } else {
            None
        }
    }

    pub fn reset(&mut self) {
        self.next_start = 0;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const WINDOW: usize = 32_000;
    const MIN: usize = 8_000;

    fn make() -> RollingWindow {
        RollingWindow::new(WINDOW, 4_800, MIN)
    }

    #[test]
    fn waits_for_minimum_audio() {
        let mut window = make();
        assert!(window.next_window(4_000).is_none());
        assert_eq!(window.next_start(), 0);
    }

    #[test]
    fn first_window_can_be_partial() {
        let mut window = make();
        let first = window.next_window(MIN);
        assert_eq!(first, Some((0, MIN)));
        assert_eq!(window.next_start(), 4_800);
    }

    #[test]
    fn full_window_advances_by_step() {
        let mut window = make();
        let first = window.next_window(WINDOW + 4_800);
        assert_eq!(first, Some((0, WINDOW)));
        let second = window.next_window(WINDOW + 4_800);
        assert_eq!(second, Some((4_800, WINDOW + 4_800)));
    }

    #[test]
    fn overlap_is_window_minus_advance() {
        let window = make();
        assert_eq!(window.overlap_len(), WINDOW - 4_800);
    }

    #[test]
    fn waits_when_next_window_not_ready() {
        let mut window = make();
        let first = window.next_window(WINDOW);
        assert_eq!(first, Some((0, WINDOW)));
        assert!(window.next_window(WINDOW + 1_000).is_none());
    }

    #[test]
    fn reset_restarts_from_zero() {
        let mut window = make();
        window.next_window(WINDOW);
        window.reset();
        assert_eq!(window.next_start(), 0);
        assert_eq!(window.next_window(MIN), Some((0, MIN)));
    }
}
