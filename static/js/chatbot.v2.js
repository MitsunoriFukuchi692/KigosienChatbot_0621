// static/js/chatbot.v2.js

// ─── グローバルエラーキャッチャ ───
window.onerror = function(message, source, lineno, colno, error) {
  console.log(`🛑 Error: ${message} at ${source}:${lineno}:${colno}`);
};

// --- 音声認識設定 ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null;
if (SpeechRecognition) {
  recog = new SpeechRecognition();
  recog.lang = 'ja-JP';
  recog.interimResults = false;
}
let activeTarget = null;
function startRecognition(targetId) {
  if (!recog) return alert('音声認識に対応していません');
  activeTarget = document.getElementById(targetId);
  recog.start();
}
if (recog) {
  recog.addEventListener('result', e => {
    activeTarget.value = e.results[0][0].transcript;
  });
}

// --- TTS 呼び出し関数 ---
function speak(text) {
  console.log('▶︎ TTS speak:', text);
  const ut = new SpeechSynthesisUtterance(text);
  ut.lang   = 'ja-JP';
  ut.volume = parseFloat(document.getElementById('volume-slider')?.value) || 1.0;
  ut.rate   = parseFloat(document.getElementById('rate-slider')?.value)   || 1.0;
  ut.pitch  = 1.0;
  window.speechSynthesis.speak(ut);
}

// --- メッセージ表示 ---
function appendMessage(sender, text) {
  const log = document.getElementById('chat-window');
  const div = document.createElement('div');
  div.className = sender==='介護士'
                  ? 'message-caregiver'
                  : sender==='被介護者'
                    ? 'message-caree'
                    : 'message-ai';
  div.textContent = `${sender}: ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// --- 送信 ---
function sendMessage(role) {
  console.log('🔧 sendMessage called:', role);
  const inputId = role==='caregiver' ? 'caregiver-input' : 'caree-input';
  const label   = role==='caregiver' ? '介護士' : '被介護者';
  const txt     = document.getElementById(inputId).value.trim();
  console.log('🔧 message text:', txt);
  if (!txt) return alert('入力してください');

  appendMessage(label, txt);
  speak(txt);
  document.getElementById(inputId).value = '';
}

// --- テンプレート対話 ---
let currentTemplates = [];
function startTemplateDialogue() {
  console.log('🔧 startTemplateDialogue');
  fetch('/ja/templates')
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(list => {
      currentTemplates = list;
      const panel = document.getElementById('template-buttons');
      panel.innerHTML = '';
      list.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item.category;
        btn.addEventListener('click', () => showCaregiverPhrases(item));
        panel.appendChild(btn);
      });
    })
    .catch(e => alert(`テンプレート取得失敗: ${e}`));
}

function showCaregiverPhrases(item) {
  console.log('🔧 showCaregiverPhrases:', item.category);
  const panel = document.getElementById('template-buttons');
  panel.innerHTML = '';
  item.caregiver.forEach(text => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      appendMessage('介護士', text);
      speak(text);
      showCareePhrases(item);
    });
    panel.appendChild(btn);
  });
}

function showCareePhrases(item) {
  console.log('🔧 showCareePhrases:', item.category);
  const panel = document.getElementById('template-buttons');
  panel.innerHTML = '';
  item.caree.forEach(text => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      appendMessage('被介護者', text);
      speak(text);
      startTemplateDialogue();
    });
    panel.appendChild(btn);
  });
}

// --- 用語説明 + TTS ---
function explainTerm() {
  const term = document.getElementById('term').value.trim();
  if (!term) return alert('用語を入力してください');
  fetch('/ja/explain', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ term, maxLength:30 })
  })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(({ explanation }) => {
      document.getElementById('explanation').textContent = explanation;
      speak(explanation);
    })
    .catch(e => alert(`用語説明失敗: ${e}`));
}

// --- 初期化 & 日報生成 ---
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('explain-btn').addEventListener('click', explainTerm);
  document.getElementById('template-start-btn').addEventListener('click', startTemplateDialogue);
  document.getElementById('save-log-btn').addEventListener('click', () => {
    /* 会話ログ保存の既存ハンドラをここに */
  });
  document.getElementById('daily-report-btn').addEventListener('click', () => {
    window.open('/ja/daily_report', '_blank');
  });
});
