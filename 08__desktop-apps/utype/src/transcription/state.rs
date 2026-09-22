use super::stable::HypothesisTracker;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum SessionStatus {
    #[default]
    Idle,
    Listening,
    Inferring,
}

#[derive(Debug, Clone)]
pub struct TranscriptionView {
    pub status: SessionStatus,
    pub utterance_active: bool,
    pub transcription: String,
    pub committed: String,
    pub partial: String,
    pub last_hypothesis: String,
}

#[derive(Debug, Default)]
pub struct TranscriptionSession {
    tracker: HypothesisTracker,
    status: SessionStatus,
    utterance_active: bool,
    last_hypothesis: String,
}

impl TranscriptionSession {
    pub fn new() -> Self {
        TranscriptionSession::default()
    }

    pub fn begin(&mut self) {
        self.status = SessionStatus::Listening;
        self.utterance_active = true;
    }

    pub fn note_inference_start(&mut self) {
        self.status = SessionStatus::Inferring;
    }

    pub fn observe(&mut self, hypothesis: &str) -> bool {
        let info = self.tracker.process(hypothesis);
        self.last_hypothesis = hypothesis.to_string();
        self.status = SessionStatus::Listening;
        self.utterance_active = true;
        !info.no_op && (info.newly_committed_words > 0 || info.partial_changed)
    }

    pub fn finalize(&mut self) -> Option<String> {
        if !self.utterance_active {
            return None;
        }
        let text = self.tracker.combined_text();
        self.reset();
        if text.is_empty() { None } else { Some(text) }
    }

    pub fn reset(&mut self) {
        self.tracker.reset();
        self.last_hypothesis.clear();
        self.utterance_active = false;
        self.status = SessionStatus::Idle;
    }

    pub fn is_active(&self) -> bool {
        self.utterance_active
    }

    pub fn view(&self) -> TranscriptionView {
        TranscriptionView {
            status: self.status,
            utterance_active: self.utterance_active,
            transcription: self.tracker.combined_text(),
            committed: self.tracker.committed_text(),
            partial: self.tracker.partial_text(),
            last_hypothesis: self.last_hypothesis.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lifecycle_begin_observe_finalize() {
        let mut session = TranscriptionSession::new();
        assert!(!session.is_active());
        session.begin();
        assert!(session.is_active());
        session.observe("hello");
        session.observe("hello world");
        assert_eq!(session.view().committed, "hello");
        let text = session.finalize();
        assert_eq!(text.as_deref(), Some("hello world"));
        assert!(!session.is_active());
        assert_eq!(session.view().status, SessionStatus::Idle);
    }

    #[test]
    fn finalize_commits_partial() {
        let mut session = TranscriptionSession::new();
        session.begin();
        session.observe("hello this is my");
        session.observe("hello this is my new");
        assert_eq!(session.view().committed, "hello this is my");
        let text = session.finalize();
        assert_eq!(text.as_deref(), Some("hello this is my new"));
    }

    #[test]
    fn finalize_with_no_activity_returns_none() {
        let mut session = TranscriptionSession::new();
        assert_eq!(session.finalize(), None);
    }

    #[test]
    fn reset_clears_utterance() {
        let mut session = TranscriptionSession::new();
        session.begin();
        session.observe("hello");
        session.reset();
        assert!(!session.is_active());
        assert!(session.view().committed.is_empty());
        assert!(session.view().partial.is_empty());
        assert_eq!(session.finalize(), None);
    }

    #[test]
    fn view_reflects_status() {
        let mut session = TranscriptionSession::new();
        session.begin();
        assert_eq!(session.view().status, SessionStatus::Listening);
        session.note_inference_start();
        assert_eq!(session.view().status, SessionStatus::Inferring);
    }
}
