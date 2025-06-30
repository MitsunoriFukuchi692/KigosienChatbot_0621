// static/js/chatbot.js
console.log('chatbot.js loaded');

// ─── TTS アンロック ───
window.addEventListener('click', function _unlockTTS() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
  }
  window.removeEventListener('click', _unlockTTS);
});
// ───────────────────────

// 要素取得（defer により DOM 構築済）
const chatContainer    = document.getElementById('chat-container');
const templates        = document.querySelectorAll('#template-container button');
const inpCaregiver     = document.getElementById('caregiver-input');
const inpElder         = document.getElementById('elder-input');
const btnCaregiverSend = document.getElementById('caregiver-send');
const btnElderSend     = document.getElementById('elder-send');
const selMicRole       = document.getElementById('mic-role');
const btnMicStart      = document.getElementById('mic-start');
const btnDownloadCsv   = document.getElementById('download-csv');
const ttsPlayer        = document.getElementById('tts-player');
const volControl       = document.getElementById('volume');
const chkSlow          = document.getElementById('slow-playback');

const apiPath = '/chat';
let recognition, currentMicRole = 'caregiver';
let conversation = [];
let currentLang = new URLSearchParams(location.search).get('lang') || 'ja';

console.log('Initializing chatbot…');

// テンプレートボタン
templates.forEach(btn => btn.addEventListener('click', () => {
  console.log('template clicked:', btn.dataset.cat);
  const cat = btn.dataset.cat;
  appendMessage('caregiver', btn.textContent);
  logConversation('caregiver', btn.textContent);
  inpElder.value = '';
  inpElder.focus();
  if (cat === '説明') {
    const term = prompt('説明してほしい用語を入力してください');
    if (term) callAIExplain(term);
  }
}));

// 介護士送信
btnCaregiverSend.addEventListener('click', () => {
  console.log('👩‍⚕️ caregiver-send clicked');
  const text = inpCaregiver.value.trim(); if (!text) return;
  appendMessage('caregiver', text);
  logConversation('caregiver', text);
  // TTSで読み上げ
  console.log('🔊 play caregiver message:', text);
  playTTS(text);
  inpCaregiver.value = '';
  inpElder.focus();
});

// 被介護者送信
btnElderSend.addEventListener('click', () => {
  console.log('👵 elder-send clicked');
  const text = inpElder.value.trim(); if (!text) return;
  appendMessage('elder', text);
  logConversation('elder', text);
  // TTSで読み上げ
  console.log('🔊 play elder message:', text);
  playTTS(text);
  inpElder.value = '';
});

// 以降同じ('click', () => {
  console.log('👵 elder-send clicked');
  const text = inpElder.value.trim(); if (!text) return;
  appendMessage('elder', text);
  logConversation('elder', text);
  inpElder.value = '';
});

// マイク入力設定
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  console.log('🎙 SpeechRecognition API is available');
  recognition = new SpeechRecognition();
  recognition.lang = currentLang === 'ja' ? 'ja-JP' : 'en-US';
  recognition.interimResults = false;
  recognition.onstart = () => console.log('🎙 recognition.onstart');
  recognition.onerror = e => console.error('🎙 recognition.onerror', e);
  recognition.onend = () => console.log('🎙 recognition.onend');
  recognition.onresult = e => {
    const text = e.results[0][0].transcript;
    console.log('🎙 recognition.onresult:', text);
    appendMessage(currentMicRole, text);
    logConversation(currentMicRole, text);
    if (currentMicRole === 'elder') inpElder.value = '';
  };
  btnMicStart.addEventListener('click', () => {
    console.log('🎙 btnMicStart clicked, calling recognition.start()');
    recognition.start();
  });
} else {
  console.warn('SpeechRecognition not supported');
  btnMicStart.disabled = true;
}
selMicRole.addEventListener('change', () => {
  console.log('mic-role changed to', selMicRole.value);
  currentMicRole = selMicRole.value;
});

// CSV保存
btnDownloadCsv.addEventListener('click', () => {
  console.log('💾 CSV保存 clicked');
  const rows = [['role','message','timestamp'], ...conversation.map(c => [c.role, c.message, c.timestamp])];
  const blob = new Blob([rows.map(r => r.join(',')).join('
')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'conversation_log.csv';
  a.click();
  URL.revokeObjectURL(a.href);
});

// 用語説明（AI 呼び出し）
function callAIExplain(term) {
  console.log('▶ send to chat:', term);
  fetch(`${apiPath}?lang=${currentLang}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'explain', message: term })
  })
  .then(res => {
    console.log('◀ response status:', res.status);
    return res.json();
  })
  .then(data => {
    console.log('◀ data.reply:', data.reply);
    appendMessage('bot', data.reply);
    // フォールバックで audio 要素を使って再生
    console.log('🔊 playTTS via audio element:', data.reply);
    const url = `/tts?text=${encodeURIComponent(data.reply)}&slow=${chkSlow.checked ? 1 : 0}`;
    ttsPlayer.src = url;
    ttsPlayer.volume = +volControl.value;
    ttsPlayer.play().catch(err => console.error('Audio playback error:', err));
    logConversation('bot', data.reply);
  })
  .catch(err => console.error('fetch error:', err));
}

// メッセージ表示
function appendMessage(role, text) {
  const d = document.createElement('div');
  d.className = `message ${role}`;
  const p = role === 'caregiver' ? '👩‍⚕️ ' : role === 'elder' ? '👵 ' : '🤖 ';
  d.textContent = p + text;
  chatContainer.appendChild(d);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 会話ログ記録
function logConversation(role, message) {
  conversation.push({ role, message, timestamp: new Date().toISOString() });
}
