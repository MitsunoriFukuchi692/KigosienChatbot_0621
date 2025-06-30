// static/js/chatbot.js
console.log('chatbot.js loaded');
// TTS unlock
window.addEventListener('click', function _unlockTTS() {
  if ('speechSynthesis' in window) window.speechSynthesis.speak(new SpeechSynthesisUtterance(''));
  window.removeEventListener('click', _unlockTTS);
});

// Element refs
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

// Template buttons
templates.forEach(btn => btn.addEventListener('click', () => {
  appendMessage('caregiver', btn.textContent);
  logConversation('caregiver', btn.textContent);
  inpElder.value = ''; inpElder.focus();
  if (btn.dataset.cat === '説明') {
    const term = prompt('説明してほしい用語を入力してください');
    if (term) callAIExplain(term);
  }
}));

// Caregiver send
btnCaregiverSend.addEventListener('click', () => {
  const text = inpCaregiver.value.trim(); if (!text) return;
  appendMessage('caregiver', text); logConversation('caregiver', text);
  inpCaregiver.value = ''; inpElder.focus();
});

// Elder send
btnElderSend.addEventListener('click', () => {
  const text = inpElder.value.trim(); if (!text) return;
  appendMessage('elder', text); logConversation('elder', text);
  inpElder.value = '';
});

// SpeechRecognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = currentLang === 'ja' ? 'ja-JP' : 'en-US';
  recognition.interimResults = false;
  recognition.onresult = e => {
    const text = e.results[0][0].transcript;
    appendMessage(currentMicRole, text); logConversation(currentMicRole, text);
    if (currentMicRole === 'elder') inpElder.value = '';
  };
  btnMicStart.addEventListener('click', () => recognition.start());
} else {
  btnMicStart.disabled = true;
}

// CSV download
btnDownloadCsv.addEventListener('click', () => {
  const rows = [['role','message','timestamp'], ...conversation.map(c=>[c.role,c.message,c.timestamp])];
  const blob = new Blob([rows.map(r=>r.join(',')).join('\n')], {type:'text/csv'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'conversation_log.csv'; a.click(); URL.revokeObjectURL(a.href);
});

// AI explain
function callAIExplain(term) {
  fetch(`${apiPath}?lang=${currentLang}`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({role:'explain',message:term})
  })
  .then(r=>r.json())
  .then(data=>{
    appendMessage('bot', data.reply);
    const url = `/tts?text=${encodeURIComponent(data.reply)}&slow=${chkSlow.checked?1:0}`;
    ttsPlayer.src = url; ttsPlayer.volume = +volControl.value; ttsPlayer.play();
    logConversation('bot', data.reply);
  });
}

// Append message
function appendMessage(role,text) {
  const d = document.createElement('div'); d.className=`message ${role}`;
  const p = role==='caregiver'?'👩‍⚕️ ':role==='elder'?'👵 ':'🤖 ';
  d.textContent = p+text; chatContainer.appendChild(d);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Log
function logConversation(role,message) {
  conversation.push({role,message,timestamp:new Date().toISOString()});
}
