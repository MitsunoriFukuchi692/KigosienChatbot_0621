// static/js/chatbot.js
console.log('chatbot.js loaded');

const apiPath = '/chat';
let recognition, currentMicRole = 'caregiver';
let conversation = [];
let currentLang = new URLSearchParams(location.search).get('lang') || 'ja';

window.addEventListener('DOMContentLoaded', () => {
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

  // テンプレート
  templates.forEach(btn => btn.addEventListener('click', () => {
    const cat = btn.dataset.cat;
    appendMessage('caregiver', btn.textContent);
    logConversation('caregiver', btn.textContent);
    inpElder.value = ''; inpElder.focus();
    if (cat === '説明') {
      const term = prompt('説明してほしい用語を入力してください');
      if (term) callAIExplain(term);
    }
  }));

  // 介護士送信
  btnCaregiverSend.addEventListener('click', () => {
    const text = inpCaregiver.value.trim(); if (!text) return;
    appendMessage('caregiver', text); logConversation('caregiver', text);
    inpCaregiver.value = ''; inpElder.focus();
  });

  // 被介護者送信
  btnElderSend.addEventListener('click', () => {
    const text = inpElder.value.trim(); if (!text) return;
    appendMessage('elder', text); logConversation('elder', text);
    inpElder.value = '';
  });

  // マイク
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = currentLang === 'ja' ? 'ja-JP' : 'en-US';
    recognition.interimResults = false;
    recognition.onresult = e => {
      const text = e.results[0][0].transcript;
      appendMessage(currentMicRole, text); logConversation(currentMicRole, text);
      if (currentMicRole === 'elder') inpElder.value = '';
    };
    btnMicStart.addEventListener('click', () => recognition.start());
  } else btnMicStart.disabled = true;
  selMicRole.addEventListener('change', () => currentMicRole = selMicRole.value);

  // CSV保存
  btnDownloadCsv.addEventListener('click', () => {
    const csv = [['role','message','timestamp'], ...conversation.map(c=>[c.role,c.message,c.timestamp])];
    const blob = new Blob([csv.map(r=>r.join(',')).join('\n')], {type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'conversation_log.csv'; a.click();
    URL.revokeObjectURL(a.href);
  });

  // AI呼び出し
  function callAIExplain(term) {
    fetch(`${apiPath}?lang=${currentLang}`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({role:'explain', message:term})
    })
    .then(r=>r.json())
    .then(data=>{ appendMessage('bot', data.reply); playTTS(data.reply); logConversation('bot', data.reply); })
    .catch(e=>console.error(e));
  }

  // 表示
  function appendMessage(role, text) {
    const d = document.createElement('div'); d.className=`message ${role}`;
    const p = role==='caregiver'?'👩‍⚕️ ':role==='elder'?'👵 ':'🤖 ';
    d.textContent = p+text; chatContainer.appendChild(d);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // TTS
  function playTTS(text) {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = currentLang==='ja'?'ja-JP':'en-US';
      u.volume = +volControl.value; u.rate = chkSlow.checked?0.6:1.0;
      speechSynthesis.speak(u);
    } else {
      ttsPlayer.src = `/tts?text=${encodeURIComponent(text)}&slow=${chkSlow.checked?1:0}`;
      ttsPlayer.volume = +volControl.value; ttsPlayer.play();
    }
  }

  // ログ
  function logConversation(role, message) {
    conversation.push({role, message, timestamp:new Date().toISOString()});
  }
});
