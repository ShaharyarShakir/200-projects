#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct CommitInfo {
    pub newly_committed_words: usize,
    pub partial_changed: bool,
    pub no_op: bool,
}

#[derive(Debug, Clone, Default)]
pub struct HypothesisTracker {
    committed: Vec<String>,
    partial: Vec<String>,
    prev_norm: Option<Vec<String>>,
}

impl HypothesisTracker {
    #[allow(dead_code)]
    pub fn new() -> Self {
        HypothesisTracker::default()
    }

    pub fn process(&mut self, hypothesis: &str) -> CommitInfo {
        let words = tokenize(hypothesis);
        if words.is_empty() {
            return CommitInfo {
                no_op: true,
                ..CommitInfo::default()
            };
        }
        let norm: Vec<String> = words.iter().map(|word| normalize_word(word)).collect();
        let lcp = match &self.prev_norm {
            Some(prev) => longest_common_prefix_len(prev, &norm),
            None => 0,
        };
        let old_len = self.committed.len();
        let new_len = old_len.max(lcp);
        let mut info = CommitInfo {
            newly_committed_words: new_len.saturating_sub(old_len),
            ..CommitInfo::default()
        };
        if new_len > old_len {
            self.committed = words[..new_len].to_vec();
        }
        let prev_partial = self.partial.clone();
        self.partial = words[new_len..].to_vec();
        info.partial_changed = prev_partial != self.partial;
        self.prev_norm = Some(norm);
        info
    }

    pub fn committed_text(&self) -> String {
        self.committed.join(" ")
    }

    pub fn partial_text(&self) -> String {
        self.partial.join(" ")
    }

    pub fn combined_text(&self) -> String {
        let mut text = String::new();
        if !self.committed.is_empty() {
            text.push_str(&self.committed.join(" "));
        }
        if !self.partial.is_empty() {
            if !text.is_empty() {
                text.push(' ');
            }
            text.push_str(&self.partial.join(" "));
        }
        text
    }

    #[allow(dead_code)]
    pub fn is_empty(&self) -> bool {
        self.committed.is_empty() && self.partial.is_empty()
    }

    pub fn reset(&mut self) {
        self.committed.clear();
        self.partial.clear();
        self.prev_norm = None;
    }
}

pub fn tokenize(text: &str) -> Vec<String> {
    text.split_whitespace()
        .map(|word| word.to_string())
        .filter(|word| !normalize_word(word).is_empty())
        .collect()
}

pub fn normalize_word(word: &str) -> String {
    word.trim()
        .to_lowercase()
        .trim_matches(|character: char| !(character.is_alphanumeric() || character == '\''))
        .to_string()
}

pub fn longest_common_prefix_len(a: &[String], b: &[String]) -> usize {
    a.iter()
        .zip(b.iter())
        .take_while(|(left, right)| left == right)
        .count()
}

#[allow(dead_code)]
pub fn stable_prefix(prev: &str, current: &str) -> String {
    let prev_words = tokenize(prev);
    let prev_norm: Vec<String> = prev_words.iter().map(|word| normalize_word(word)).collect();
    let current_words = tokenize(current);
    let current_norm: Vec<String> = current_words
        .iter()
        .map(|word| normalize_word(word))
        .collect();
    let lcp = longest_common_prefix_len(&prev_norm, &current_norm);
    current_words[..lcp].join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_case_and_punctuation() {
        assert_eq!(normalize_word("Hello,"), "hello");
        assert_eq!(normalize_word("WORLD"), "world");
        assert_eq!(normalize_word("Can't"), "can't");
        assert_eq!(normalize_word("..."), "");
    }

    #[test]
    fn whitespace_is_normalized() {
        let a = tokenize("hello   world");
        let b = tokenize("hello world");
        assert_eq!(a, b);
        let a_norm: Vec<String> = a.iter().map(|w| normalize_word(w)).collect();
        let b_norm: Vec<String> = b.iter().map(|w| normalize_word(w)).collect();
        assert_eq!(longest_common_prefix_len(&a_norm, &b_norm), 2);
    }

    #[test]
    fn lcp_of_hello_world_vs_hello() {
        let a = tokenize("hello world");
        let b = tokenize("hello");
        let an: Vec<String> = a.iter().map(|w| normalize_word(w)).collect();
        let bn: Vec<String> = b.iter().map(|w| normalize_word(w)).collect();
        assert_eq!(longest_common_prefix_len(&an, &bn), 1);
    }

    #[test]
    fn lcp_of_hello_world_vs_hello_word() {
        let a = tokenize("hello world");
        let b = tokenize("hello word");
        let an: Vec<String> = a.iter().map(|w| normalize_word(w)).collect();
        let bn: Vec<String> = b.iter().map(|w| normalize_word(w)).collect();
        assert_eq!(longest_common_prefix_len(&an, &bn), 1);
    }

    #[test]
    fn lcp_of_hello_this_is_vs_hello_this_is_a() {
        let a = tokenize("hello this is");
        let b = tokenize("hello this is a");
        let an: Vec<String> = a.iter().map(|w| normalize_word(w)).collect();
        let bn: Vec<String> = b.iter().map(|w| normalize_word(w)).collect();
        assert_eq!(longest_common_prefix_len(&an, &bn), 3);
    }

    #[test]
    fn stable_prefix_hello_this_is() {
        assert_eq!(
            stable_prefix("hello this is", "hello this is my"),
            "hello this is"
        );
    }

    #[test]
    fn commits_only_after_second_confirmation() {
        let mut tracker = HypothesisTracker::new();
        let first = tracker.process("hello this is my");
        assert_eq!(first.newly_committed_words, 0);
        assert_eq!(tracker.committed_text(), "");
        assert_eq!(tracker.partial_text(), "hello this is my");

        let second = tracker.process("hello this is my new");
        assert_eq!(second.newly_committed_words, 4);
        assert_eq!(tracker.committed_text(), "hello this is my");
        assert_eq!(tracker.partial_text(), "new");

        let third = tracker.process("hello this is my new project");
        assert_eq!(third.newly_committed_words, 1);
        assert_eq!(tracker.committed_text(), "hello this is my new");
        assert_eq!(tracker.partial_text(), "project");
    }

    #[test]
    fn committed_text_is_never_rewritten() {
        let mut tracker = HypothesisTracker::new();
        tracker.process("hello this is my");
        tracker.process("hello this is my new");
        tracker.process("hello this is my new project");
        assert_eq!(tracker.committed_text(), "hello this is my new");
        tracker.process("hello this is completely different now");
        assert_eq!(tracker.committed_text(), "hello this is my new");
        assert_eq!(tracker.partial_text(), "now");
    }

    #[test]
    fn partial_can_change_without_committing() {
        let mut tracker = HypothesisTracker::new();
        tracker.process("hello this is my");
        tracker.process("hello this is my new");
        assert_eq!(tracker.committed_text(), "hello this is my");
        assert_eq!(tracker.partial_text(), "new");
        tracker.process("hello this is my new project");
        assert_eq!(tracker.partial_text(), "project");
    }

    #[test]
    fn words_are_not_committed_mid_word() {
        let mut tracker = HypothesisTracker::new();
        tracker.process("hello proj");
        tracker.process("hello project");
        assert_eq!(tracker.committed_text(), "hello");
        assert_eq!(tracker.partial_text(), "project");
        assert_ne!(tracker.committed_text(), "hello proj");
    }

    #[test]
    fn empty_hypothesis_is_a_noop() {
        let mut tracker = HypothesisTracker::new();
        let info = tracker.process("");
        assert!(info.no_op);
        assert!(tracker.is_empty());
        tracker.process("hello");
        let info = tracker.process("   ");
        assert!(info.no_op);
        assert_eq!(tracker.partial_text(), "hello");
    }

    #[test]
    fn combined_text_matches_display() {
        let mut tracker = HypothesisTracker::new();
        tracker.process("hello this is my");
        tracker.process("hello this is my new");
        assert_eq!(tracker.combined_text(), "hello this is my new");
    }

    #[test]
    fn reset_clears_everything() {
        let mut tracker = HypothesisTracker::new();
        tracker.process("hello");
        tracker.process("hello world");
        assert_eq!(tracker.committed_text(), "hello");
        tracker.reset();
        assert!(tracker.is_empty());
        assert_eq!(tracker.committed_text(), "");
        assert_eq!(tracker.partial_text(), "");
    }
}
