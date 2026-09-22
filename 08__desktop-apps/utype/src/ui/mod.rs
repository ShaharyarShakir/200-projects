pub mod terminal;

use crate::diagnostics::DiagSnapshot;
use crate::transcription::state::TranscriptionView;

pub enum UiEvent {
    View(TranscriptionView),
    Diagnostics(DiagSnapshot),
    Finalized(String),
}

pub trait Ui {
    fn render(&mut self, view: &TranscriptionView, diag: Option<&DiagSnapshot>, finalized: &str);
}
