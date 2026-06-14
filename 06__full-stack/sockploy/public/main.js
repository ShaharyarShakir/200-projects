function switchTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');
  if (name === 'containers') loadContainers();
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 2800);
}

function appendLog(msg, cls = '') {
  const body = document.getElementById('log-body');
  const line = document.createElement('div');
  line.className = 'log-line ' + cls;
  const prefix = document.createElement('span');
  prefix.className = 'prefix';
  prefix.textContent = cls === 'error' ? '✗' : cls === 'success' ? '✓' : '›';
  line.appendChild(prefix);
  line.appendChild(document.createTextNode(msg));
  body.appendChild(line);
  body.scrollTop = body.scrollHeight;
}

async function deployContainer() {
  const image   = document.getElementById('img-input').value.trim() || 'nginx';
  const tag     = document.getElementById('tag-input').value.trim() || 'latest';
  const btn     = document.getElementById('deploy-btn');
  const logPanel  = document.getElementById('log-panel');
  const logBody   = document.getElementById('log-body');
  const spinner   = document.getElementById('log-spinner');
  const logTitle  = document.getElementById('log-title');
  const resultBar = document.getElementById('result-bar');

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> deploying…';
  logBody.innerHTML = '';
  logPanel.classList.add('visible');
  resultBar.classList.remove('visible');
  spinner.style.display = 'block';
  logTitle.textContent = `deploying ${image}:${tag}`;

  try {
    const res = await fetch('/container', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image, tag })
    });

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop();
      for (const part of parts) {
        const raw = part.replace(/^data: /, '').trim();
        if (!raw) continue;
        try {
          const ev = JSON.parse(raw);
          if (ev.type === 'log') {
            appendLog(ev.message);
          } else if (ev.type === 'done') {
            appendLog('Container is up.', 'success');
            spinner.style.display = 'none';
            logTitle.textContent = 'done';
            document.getElementById('r-name').textContent   = ev.containerName;
            document.getElementById('r-domain').textContent = ev.domain;
            resultBar.classList.add('visible');
            showToast('Deployed ' + ev.containerName);
          } else if (ev.type === 'error') {
            appendLog(ev.message, 'error');
            spinner.style.display = 'none';
            logTitle.textContent = 'failed';
            showToast(ev.message, 'error');
          }
        } catch (_) {}
      }
    }
  } catch (e) {
    appendLog(e.message, 'error');
    spinner.style.display = 'none';
    logTitle.textContent = 'failed';
    showToast(e.message, 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-rocket" style="font-size:14px;" aria-hidden="true"></i> Deploy';
}

async function loadContainers() {
  const list = document.getElementById('container-list');
  list.innerHTML = '<div class="loading-state"><div class="spinner"></div> fetching containers…</div>';
  try {
    const res  = await fetch('/containers');
    const data = await res.json();
    renderContainers(data.data || []);
  } catch (e) {
    list.innerHTML = `<div class="empty-state" style="color:var(--danger);">
      <i class="ti ti-alert-triangle" aria-hidden="true"></i>
      <span>Cannot reach /containers — is the server up?</span>
    </div>`;
  }
}

function renderContainers(containers) {
  const list = document.getElementById('container-list');
  if (!containers.length) {
    list.innerHTML = `<div class="empty-state">
      <i class="ti ti-box" aria-hidden="true"></i>
      <span>No containers found</span>
    </div>`;
    return;
  }
  list.innerHTML = containers.map(c => {
    const status = (c.State || 'unknown').toLowerCase();
    const name   = (c.Names?.[0] || c.Id || '').replace(/^\//, '');
    const image  = c.Image || '';
    const id12   = (c.Id || '').slice(0, 12);
    return `
      <div class="c-card">
        <div class="sdot ${status}"></div>
        <div class="c-info">
          <div class="c-name">${name}</div>
          <div class="c-meta">
            <span>${image}</span>
            <span>${id12}</span>
          </div>
        </div>
        <span class="badge ${status}">${status}</span>
        <div class="c-actions">
          <button class="btn-icon visit" onclick="visitContainer('${name}')">
            <i class="ti ti-external-link" style="font-size:12px;" aria-hidden="true"></i> Visit
          </button>
          <button class="btn-icon danger" onclick="deleteContainer('${c.Id}', this)" aria-label="Remove container">
            <i class="ti ti-trash" style="font-size:12px;" aria-hidden="true"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}

function visitContainer(name) {
  window.open(`http://${name}.localhost`, '_blank');
}

async function deleteContainer(id, btn) {
  if (!confirm(`Remove container ${id.slice(0, 12)}?`)) return;
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div>';
  try {
    await fetch(`/container/${id}`, { method: 'DELETE' });
    showToast('Container removed');
    setTimeout(loadContainers, 400);
  } catch (e) {
    showToast('Delete failed', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="ti ti-trash" style="font-size:12px;" aria-hidden="true"></i>';
  }
}
