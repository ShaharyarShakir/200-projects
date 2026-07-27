const API = 'http://localhost:3000/api/ai';

export async function summarize(content: string) {
  const res = await fetch(`${API}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content }),
  });

  return res.json();
}

export async function explain(content: string) {
  const res = await fetch(`${API}/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content }),
  });

  return res.json();
}

export async function rewrite(content: string, style: string) {
  const res = await fetch(`${API}/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content, style }),
  });

  return res.json();
}