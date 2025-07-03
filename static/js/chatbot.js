// static/js/chatbot.js

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

// --- メッセージ表示 ---  
function appendMessage(sender, text) {
  const log = document.getElementById('chat-window');
  const div = document.createElement('div');
  div.className = (sender === '介護士' ? 'message-caregiver' : sender === '被介護者' ? 'message-caree' : 'message-ai');
  div.textContent = `${sender}: ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// --- 送信（AI呼び出しなし） ---  
function sendMessage(role) {
  const inputId = role === 'caregiver' ? 'caregiver-input' : 'caree-input';
  const senderLabel = role === 'caregiver' ? '介護士' : '被介護者';
  const input = document.getElementById(inputId);
  const text = input.value.trim();
  if (!text) { alert('入力してください'); return; }
  appendMessage(senderLabel, text);
  input.value = '';
}

// 介護士・被介護者用ラッパー  
function sendCaregiverMessage() { sendMessage('caregiver'); }
function sendCareeMessage()      { sendMessage('caree'); }

// --- テンプレート取得・表示 ---  
async function loadTemplates(role) {
  const res = await fetch('/ja/templates');
  if (!res.ok) return;
  const list = await res.json();
  const container = document.getElementById('template-buttons');
  container.innerHTML = '';
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
          const targetId = role === 'caregiver' ? 'caregiver-input' : 'caree-input';
          document.getElementById(targetId).value = p;
        });
        sub.appendChild(sb);
      });
      container.appendChild(sub);
    });
    container.appendChild(btn);
  });
}
function caregiverTemplates() { loadTemplates('caregiver'); }
function careeTemplates()    { loadTemplates('caree'); }

// --- 用語説明 + 読み上げ ---  
async function explainTerm() {
  const term = document.getElementById('term').value.trim();
  if (!term) return;
  const res = await fetch('/ja/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ term, maxLength: 30 })
  });
  if (!res.ok) return;
  const { explanation } = await res.json();
  document.getElementById('explanation').textContent = explanation;
  const u = new SpeechSynthesisUtterance(explanation);
  u.lang = 'ja-JP';
  u.rate = document.getElementById('rate-slider').value;
  u.volume = document.getElementById('volume-slider').value;
  speechSynthesis.speak(u);
}

// --- 初期化 ---  
window.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#explain-btn').addEventListener('click', explainTerm);
});
