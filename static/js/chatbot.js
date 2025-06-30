// static/js/chatbot.js
console.log('debug: chatbot.js loaded');

window.addEventListener('click', function _unlockTTS() {
  if (window.speechSynthesis) {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
  }
  window.removeEventListener('click', _unlockTTS);
});

const chatContainer    = document.getElementById('chat-container');
const templates        = document.querySelectorAll('#template-container button');
const inpCaregiver     = document.getElementById('caregiver-input');
const inpElder         = document.getElementById('elder-input');
const btnCaregiverSend = document.getElementById('caregiver-send');
const btnElderSend     = document.getElementById('elder-send');
const selMicRole       = document.getElementById('mic-role');
const btnMicStart      = document.getElementById('mic-start');
const btnDownloadCsv   = document.getElementById('download-csv');
const volControl       = document.getElementById('volume');
const chkSlow          = document.getElementById('slow-playback');

const apiPath = '/chat';
let conversation = [];
let currentMicRole = 'caregiver';
let currentLang = new URLSearchParams(location.search).get('lang') || 'ja';

// テンプレートボタン
templates.forEach(btn => {
  btn.addEventListener('click', () => {
    console.log('template clicked:', btn.dataset.cat);
    appendMessage('caregiver', btn.textContent);
    logConversation('caregiver', btn.textContent);
    inpElder.value = '';
    inpElder.focus();
    if (btn.dataset.cat === '説明') {
      const term = prompt('説明してほしい用語を入力してください');
      if (term) callAIExplain(term);
    }
  });
});

// 介護士送信
btnCaregiverSend.addEventListener('click', () => {
  const text = inpCaregiver.value.trim();
  if (!text) return;
  console.log('caregiver send:', text);
  appendMessage('caregiver', text);
  logConversation('caregiver', text);
  playTTS(text);
  inpCaregiver.value = '';
  inpElder.focus();
});

// 被介護者送信
btnElderSend.addEventListener('click', () => {
  const text = inpElder.value.trim();
  if (!text) return;
  console.log('elder send:', text);
  appendMessage('elder', text);
  logConversation('elder', text);
  playTTS(text);
  inpElder.value = '';
});

// 音声認識
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRec) {
  const recog = new SpeechRec();
  recog.lang = currentLang === 'ja' ? 'ja-JP' : 'en-US';
  recog.interimResults = false;
  recog.addEventListener('result', e => {
    const txt = e.results[0][0].transcript;
    console.log('recognition result:', txt);
    appendMessage(currentMicRole, txt);
    logConversation(currentMicRole, txt);
    playTTS(txt);
    if (currentMicRole === 'elder') inpElder.value = '';
  });
  btnMicStart.addEventListener('click', () => {
    currentMicRole = selMicRole.value;
    console.log('start recognition as', currentMicRole);
    recog.start();
  });
} else {
  btnMicStart.disabled = true;
}

// CSV保存
btnDownloadCsv.addEventListener('click', () => {
  const rows = [['role','message','timestamp'], ...conversation.map(c=>[c.role,c.message,c.timestamp])];
  const csv = rows.map(r=>r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'conversation_log.csv';
  a.click();
  URL.revokeObjectURL(a.href);
});

// AI用語説明
function callAIExplain(term) {
  console.log('callAIExplain:', term);
  fetch(`${apiPath}?lang=${currentLang}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'explain', message: term })
  })
  .then(r => r.json())
  .then(data => {
    console.log('AI reply:', data.reply);
    appendMessage('bot', data.reply);
    playTTS(data.reply);
    logConversation('bot', data.reply);
  })
  .catch(err => console.error(err));
}

// TTS再生
function playTTS(text) {
  if (!window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = currentLang === 'ja' ? 'ja-JP' : 'en-US';
  u.volume = +volControl.value;
  u.rate = chkSlow.checked ? 0.6 : 1.0;
  window.speechSynthesis.speak(u);
}

// DOMへ表示
function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  const prefix = role === 'caregiver' ? '👩‍⚕️ ' : role === 'elder' ? '👵 ' : '';
  div.textContent = prefix + text;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ログ記録
function logConversation(role, message) {
  conversation.push({ role, message, timestamp: new Date().toISOString() });
}
