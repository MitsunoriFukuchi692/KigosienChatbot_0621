// static/js/chatbot.js

// グローバルエラーキャッチ用
window.onerror = function(message, source, lineno, colno, error) {
  alert(
    "★JS エラー検出★\n" +
    "メッセージ: " + message + "\n" +
    "ファイル: " + source + "\n" +
    "行番号: " + lineno + ", 列番号: " + colno
  );
};

// --- 音声認識設定 ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recog = SpeechRecognition ? new SpeechRecognition() : null;
if (recog) {
  recog.lang = 'ja-JP';
  recog.interimResults = false;
}

let activeTarget = null;
function startRecognition(targetId) {
  if (!recog) { alert('音声認識に対応していません'); return; }
  activeTarget = document.getElementById(targetId);
  recog.start();
}
if (recog) {
  recog.addEventListener('result', e => {
    activeTarget.value = e.results[0][0].transcript;
  });
}

// --- チャット送信 ---
function appendMessage(sender, text) {
  const log = document.getElementById('chat-window');
  const div = document.createElement('div');
  div.className = sender === '介護士' ? 'message-caregiver' : (sender==='AI'?'message-ai':'message-caree');
  div.textContent = `${sender}: ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

async function sendMessage(role) {
  const inputId = role === 'caregiver' ? 'caregiver-input' : 'caree-input';
  const senderLabel = role === 'caregiver' ? '介護士' : '被介護者';
  const input = document.getElementById(inputId);
  const text = input.value.trim();
  if (!text) { alert('入力してください'); return; }
  appendMessage(senderLabel, text);
  input.value = '';

  // AI 応答
  const res = await fetch('/ja/chat', {
    method: 'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ message: text, messages: [] })
  });
  const json = await res.json();
  if (json.response) appendMessage('AI', json.response);
}

// --- テンプレート取得・表示 ---
async function loadTemplates() {
  const res = await fetch('/ja/templates');
  const list = await res.json();
  const container = document.getElementById('template-buttons');
  container.innerHTML = ''; // クリア
  list.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat.category;
    btn.addEventListener('click', () => {
      const sub = document.createElement('div');
      sub.className = 'sub-templates';
      cat.phrases.forEach(p => {
        const sb = document.createElement('button');
        sb.textContent = p;
        sb.addEventListener('click', () => {
          document.getElementById('caregiver-input').value = p;
        });
        sub.appendChild(sb);
      });
      container.appendChild(sub);
    });
    container.appendChild(btn);
  });
}

// --- 用語説明／読み上げ ---
async function explainTerm() {
  const term = document.getElementById('term').value.trim();
  if (!term) return;
  const res = await fetch('/ja/explain', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ term, maxLength:30 })
  });
  const { explanation } = await res.json();
  document.getElementById('explanation').textContent = explanation;
  const u = new SpeechSynthesisUtterance(explanation);
  u.lang = 'ja-JP';
  u.rate = document.getElementById('rate-slider').value;
  u.volume = document.getElementById('volume-slider').value;
  speechSynthesis.speak(u);
}

// --- HTML 側 inline onclick 用のエイリアス ---
function startCaregiverRecognition() { startRecognition('caregiver-input'); }
function sendCaregiverMessage()      { sendMessage('caregiver'); }
function startCareeRecognition()     { startRecognition('caree-input'); }
function sendCareeMessage()          { sendMessage('caree'); }
function createTemplateButtons()     { loadTemplates(); }
function caregiverTemplates()        { loadTemplates(); }
function careeTemplates()            { loadTemplates(); }

// --- 初期化 ---
window.addEventListener('DOMContentLoaded', () => {
  // 送信／認識ボタン
  document.getElementById('caregiver-input');  
  document.getElementById('caree-input');
  // 用語説明
  document.getElementById('explain-btn').addEventListener('click', explainTerm);
  // テンプレート読み込み
  loadTemplates();
});
