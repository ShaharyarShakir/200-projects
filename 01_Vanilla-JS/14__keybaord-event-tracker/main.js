const keySpan = document.getElementById('key');
const codeSpan = document.getElementById('code');
const shiftSpan = document.getElementById('shift');
const ctrlSpan = document.getElementById('ctrl');
const altSpan = document.getElementById('alt');
const historyList = document.getElementById('historyList');

let keyHistory = [];

document.addEventListener('keydown', function (event) {
  keySpan.textContent = event.key;
  codeSpan.textContent = event.code;
  shiftSpan.textContent = event.shiftKey;
  ctrlSpan.textContent = event.ctrlKey;
  altSpan.textContent = event.altKey;

  const keyData = `${event.key} (Code: ${event.code})`;
  keyHistory.unshift(keyData);
  if (keyHistory.length > 5) keyHistory.pop();
  renderHistory();

  highlightKey(event.code);
});

document.addEventListener('keyup', function (event) {
  removeHighlight(event.code);
});

function renderHistory() {
  historyList.innerHTML = '';
  keyHistory.forEach(key => {
    const li = document.createElement('li');
    li.textContent = key;
    historyList.appendChild(li);
  });
}

function highlightKey(code) {
  const key = document.querySelector(`.key[data-code="${code}"]`);
  if (key) key.classList.add('active');
}

function removeHighlight(code) {
  const key = document.querySelector(`.key[data-code="${code}"]`);
  if (key) key.classList.remove('active');
}

