pub mod energy;

pub trait Vad {
    fn feed(&mut self, samples: &[f32]) -> VadFeedback;
    fn reset(&mut self);
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct VadFeedback {
    pub speech: bool,
    pub utterance_ended: bool,
}
