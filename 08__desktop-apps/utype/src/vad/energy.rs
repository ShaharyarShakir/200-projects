use super::{Vad, VadFeedback};

pub struct EnergyVad {
    frame_samples: usize,
    rms_threshold: f32,
    silence_timeout_frames: usize,
    pending: Vec<f32>,
    silence_frames: usize,
    in_utterance: bool,
}

impl EnergyVad {
    pub fn new(frame_samples: usize, rms_threshold: f32, silence_timeout_frames: usize) -> Self {
        assert!(frame_samples > 0, "VAD frame size must be positive");
        EnergyVad {
            frame_samples,
            rms_threshold,
            silence_timeout_frames,
            pending: Vec::with_capacity(frame_samples * 2),
            silence_frames: 0,
            in_utterance: false,
        }
    }
}

impl Vad for EnergyVad {
    fn feed(&mut self, samples: &[f32]) -> VadFeedback {
        let mut feedback = VadFeedback::default();
        self.pending.extend_from_slice(samples);
        let mut consumed = 0usize;
        let mut cursor = 0usize;
        while self.pending.len() >= cursor + self.frame_samples {
            let frame = &self.pending[cursor..cursor + self.frame_samples];
            cursor += self.frame_samples;
            consumed = cursor;
            if frame_rms(frame) >= self.rms_threshold {
                feedback.speech = true;
                self.silence_frames = 0;
                self.in_utterance = true;
            } else if self.in_utterance {
                self.silence_frames += 1;
                if self.silence_frames >= self.silence_timeout_frames {
                    feedback.utterance_ended = true;
                    self.silence_frames = 0;
                    self.in_utterance = false;
                }
            }
        }
        if consumed > 0 {
            self.pending.drain(..consumed);
        }
        feedback
    }

    fn reset(&mut self) {
        self.pending.clear();
        self.silence_frames = 0;
        self.in_utterance = false;
    }
}

fn frame_rms(frame: &[f32]) -> f32 {
    let sum_squares: f64 = frame
        .iter()
        .map(|sample| (*sample as f64) * (*sample as f64))
        .sum();
    (sum_squares / frame.len() as f64).sqrt() as f32
}

#[cfg(test)]
mod tests {
    use super::*;

    fn vad_with_timeout(frames: usize) -> EnergyVad {
        EnergyVad::new(20, 0.0025, frames)
    }

    #[test]
    fn silence_alone_never_finalizes() {
        let mut vad = vad_with_timeout(5);
        let silence = [0.0_f32; 20];
        for _ in 0..20 {
            let feedback = vad.feed(&silence);
            assert!(!feedback.utterance_ended);
        }
    }

    #[test]
    fn speech_is_detected() {
        let mut vad = vad_with_timeout(5);
        let speech = [0.1_f32; 20];
        let feedback = vad.feed(&speech);
        assert!(feedback.speech);
    }

    #[test]
    fn limits_silence_after_speech() {
        let mut vad = vad_with_timeout(5);
        let speech = [0.1_f32; 20];
        let silence = [0.0_f32; 20];
        vad.feed(&speech);
        let mut ended = false;
        for _ in 0..6 {
            let feedback = vad.feed(&silence);
            if feedback.utterance_ended {
                ended = true;
            }
        }
        assert!(ended);
    }

    #[test]
    fn quiet_speech_above_threshold_is_not_treated_as_silence() {
        let mut vad = EnergyVad::new(20, 0.0005, 5);
        let quiet_speech = [0.001_f32; 20];
        let feedback = vad.feed(&quiet_speech);
        assert!(feedback.speech);
        assert!(!feedback.utterance_ended);
    }

    #[test]
    fn partial_frames_do_not_break_detection() {
        let mut vad = vad_with_timeout(5);
        vad.feed(&[0.1_f32; 7]);
        let feedback = vad.feed(&[0.1_f32; 13]);
        assert!(feedback.speech);
        let mut ended = false;
        for _ in 0..6 {
            let feedback = vad.feed(&[0.0_f32; 33]);
            if feedback.utterance_ended {
                ended = true;
            }
        }
        assert!(ended);
    }

    #[test]
    fn reset_clears_utterance() {
        let mut vad = vad_with_timeout(5);
        vad.feed(&[0.1_f32; 20]);
        vad.reset();
        let silence = [0.0_f32; 20];
        for _ in 0..20 {
            let feedback = vad.feed(&silence);
            assert!(!feedback.utterance_ended);
        }
    }
}
