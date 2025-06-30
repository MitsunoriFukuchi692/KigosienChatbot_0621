console.log('chatbot.js loaded');

const apiUrl = 'chat';
let recognition, currentMicRole = 'caregiver';
let conversation = [];

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

  // ログ用
  btnCaregiverSend.addEventListener('click', () => console.log('👩‍⚕️ caregiver-send clicked'));
  btnElderSend.addEventListener('click', () => console.log('👵 elder-send clicked'));

  // テンプレート
  templates.forEach(btn => {
    btn.addEventListener('click', () => {
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
    });
  });

  // 介護士送信
  btnCaregiverSend.addEventListener('click', () => {
    const text = inpCaregiver.value.trim();
    if (!text) return;
    appendMessage('caregiver', text);
    logConversation('caregiver', text);
    inpCaregiver.value = '';
    inpElder.focus();
  });

  // 被介護者送信
  btnElderSend.addEventListener('click', () => {
    const text = inpElder.value.trim();
    if (!text) return;
    appendMessage('elder', text);
    logConversation('elder', text);
    inpElder.value = '';
  });

  // マイク
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.onstart    = () => console.log('recognition started');
    recognition.onerror    = e => console.error('recognition error', e);
    recognition.onresult   = e => {
      const text = e.results[0][0].transcript;
      console.log('recognition result:', text);
      const role = currentMicRole;
      appendMessage(role, text);
      logConversation(role, text);
      if (role === 'elder') inpElder.value = '';
    };
    btnMicStart.addEventListener('click', () => {
      console.log('mic start for', currentMicRole);
      recognition.lang = 'ja-JP';
      recognition.start();
    });
  } else {
    btnMicStart.disabled = true;
  }
  selMicRole.addEventListener('change', () => currentMicRole = selMicRole.value);

  // CSV
  btnDownloadCsv.addEventListener('click', () => {
    const header = ['role','message','timestamp'];
    const rows = conversation.map(c => [c.role, c.message, c.timestamp]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'conversation_log.csv';
    a.click();
    URL.revokeObjectURL(url);
  });

  // AI 呼び出し
  function callAIExplain(term) {
    console.log('▶ send to chat:', term);
    fetch(apiUrl, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({role:'explain', message:term})
    })
      .then(res => { console.log('◀ status', res.status); return res.json(); })
      .then(data => {
        appendMessage('bot', data.reply);
        playTTS(data.reply);
        logConversation('bot', data.reply);
      })
      .catch(err => console.error('fetch error', err));
  }

  // 表示
  function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    const prefix = role==='caregiver' ? '👩‍⚕️ ' : role==='elder' ? '👵 ' : '';
    div.textContent = prefix + text;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // TTS
  function playTTS(text) {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ja-JP'; utter.volume = +volControl.value; utter.rate = chkSlow.checked?0.6:1.0;
      window.speechSynthesis.speak(utter);
    } else {
      ttsPlayer.src = `/tts?text=${encodeURIComponent(text)}&slow=${chkSlow.checked?1:0}`;
      ttsPlayer.volume = +volControl.value;
      ttsPlayer.play();
    }
  }

  // ログ
  function logConversation(role, message) {
    conversation.push({role, message, timestamp:new Date().toISOString()});
  }
});