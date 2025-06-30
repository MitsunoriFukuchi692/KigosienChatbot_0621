// static/js/chatbot.js
const apiUrl = 'chat';  // 修正：絶対パス '/chat' → 相対パス 'chat'
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

  // テンプレートボタンクリック
  templates.forEach(btn => {
    btn.addEventListener('click', () => {
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

  // マイク対象切替
  selMicRole.addEventListener('change', () => {
    currentMicRole = selMicRole.value;
  });

  // マイク開始
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    btnMicStart.addEventListener('click', () => recognition.start());
    recognition.onresult = e => {
      const text = e.results[0][0].transcript;
      const role = currentMicRole;
      appendMessage(role, text);
      logConversation(role, text);
      if (role === 'elder') inpElder.value = '';
    };
  } else {
    btnMicStart.disabled = true;
  }

  // CSV保存
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

  // AI 呼び出し （用語説明のみ）
  function callAIExplain(term) {
    console.log('▶ sending to chat:', term);
    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'explain', message: term })
    })
    .then(res => {
      console.log('◀ response status:', res.status);
      return res.json();
    })
    .then(data => {
      appendMessage('bot', data.reply);
      playTTS(data.reply);
      logConversation('bot', data.reply);
    })
    .catch(err => {
      console.error('✖ fetch error:', err);
    });
  }

  // メッセージ表示
  function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    const prefix = role === 'caregiver' ? '👩‍⚕️ ' : role === 'elder' ? '👵 ' : '';
    div.textContent = prefix + text;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // TTS 再生
  function playTTS(text) {
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ja-JP';
      utter.volume = parseFloat(volControl.value);
      utter.rate = chkSlow.checked ? 0.6 : 1.0;
      window.speechSynthesis.speak(utter);
    } else {
      ttsPlayer.src = `/tts?text=${encodeURIComponent(text)}&slow=${chkSlow.checked?1:0}`;
      ttsPlayer.volume = parseFloat(volControl.value);
      ttsPlayer.play();
    }
  }

  // ログ記録
  function logConversation(role, message) {
    conversation.push({ role, message, timestamp: new Date().toISOString() });
  }
});
