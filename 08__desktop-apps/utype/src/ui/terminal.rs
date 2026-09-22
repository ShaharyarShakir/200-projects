use std::io::{self, Write as IoWrite};

use super::Ui;
use crate::diagnostics::DiagSnapshot;
use crate::transcription::state::{SessionStatus, TranscriptionView};

pub struct TerminalUi {
    last_block_height: usize,
    last_rendered: Option<String>,
    finalized_lines: Vec<String>,
}

impl TerminalUi {
    pub fn new() -> Self {
        TerminalUi {
            last_block_height: 0,
            last_rendered: None,
            finalized_lines: Vec::new(),
        }
    }
}

impl Ui for TerminalUi {
    fn render(&mut self, view: &TranscriptionView, diag: Option<&DiagSnapshot>, finalized: &str) {
        let status_string = match view.status {
            SessionStatus::Idle => "Idle",
            SessionStatus::Listening => "Listening",
            SessionStatus::Inferring => "Inferring",
        };
        let mic = if view.utterance_active { "●" } else { "○" };

        if !finalized.is_empty() {
            self.finalized_lines.push(finalized.to_string());
            if self.finalized_lines.len() > 3 {
                self.finalized_lines.remove(0);
            }
        }

        let mut lines = Vec::new();
        lines.push(String::new());
        lines.push(format!("Status: {mic} {status_string}"));
        lines.push("─".repeat(50));
        lines.push(String::new());

        let display_text = if view.transcription.is_empty() {
            ".".to_string()
        } else {
            view.transcription.clone()
        };
        lines.push(display_text);
        lines.push(String::new());
        lines.push(format!("Committed: {}", view.committed));
        lines.push(format!("Partial:   {}", view.partial));
        if !self.finalized_lines.is_empty() {
            lines.push(format!("Finalized: {}", self.finalized_lines.join(" | ")));
        }

        if let Some(diag) = diag {
            lines.push(String::new());
            lines.push("── Debug ──".into());
            if !view.last_hypothesis.is_empty() {
                lines.push(format!("last hypothesis: {}", view.last_hypothesis));
            }
            lines.extend(diag.lines());
        }

        let block = lines.join("\n");

        if self.last_rendered.as_deref() == Some(block.as_str()) {
            return;
        }

        if self.last_block_height > 0 {
            clear_previous_block(self.last_block_height);
        }
        let stdout = io::stdout();
        let mut lock = stdout.lock();
        let _ = lock.write_all(b"\x1b[?25l");
        let _ = lock.write_all(block.as_bytes());
        let _ = lock.write_all(b"  \n\x1b[?25h");
        let _ = lock.flush();
        self.last_block_height = lines.len();
        self.last_rendered = Some(block);
    }
}

fn clear_previous_block(height: usize) {
    let mut stdout = io::stdout().lock();
    for _ in 0..height {
        let _ = stdout.write_all(b"\x1b[1A\x1b[2K");
    }
    let _ = stdout.flush();
}
