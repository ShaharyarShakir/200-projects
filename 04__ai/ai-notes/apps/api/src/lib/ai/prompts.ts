export const SYSTEM_PROMPT = `
You are an AI assistant for a note-taking application.

Rules:
- Be concise and helpful.
- Return clean Markdown.
- Preserve technical accuracy.
- Do not invent facts that are not in the note.
`;

export const SUMMARIZE_PROMPT = `
Summarize the following note in 5-10 bullet points.

Note:
{content}
`;

export const EXPLAIN_PROMPT = `
Explain the following text in simple terms for a software engineering student.

Text:
{content}
`;

export const REWRITE_PROMPT = `
Rewrite the following text in a {style} style.

Text:
{content}
`;