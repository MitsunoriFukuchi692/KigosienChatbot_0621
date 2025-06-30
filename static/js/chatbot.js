const socketUrl = '/chat';
const tts = window.speechSynthesis;
let recognition;

document.addEventListener('DOMContentLoaded', () => {
  const chatWindow = document.getElementById('chat-window');
  const inputMsg = document.getElementById('input-msg');
  const btnSend = document.getElementById('btn-send');
  const btnVoice = document.getElementById('btn-voice');
  const templates = document.querySelectorAll('.template-buttons button');
  const langButtons = document.querySelectorAll('.lang-switch button');
  let currentLang = 'ja';

  // 言語切替
  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      langButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLang = btn.id === 'btn-en' ? 'en' : 'ja';
    });
  });

  // テンプレート挿入
  templates.forEach(btn => {
    btn.addEventListener('click', () => {
      inputMsg.value = btn.textContent;
      sendMessage();
    });
  });

  // 送信
  btnSend.addEventListener('click', sendMessage);
  inputMsg.addEventListener('keypress', e => {
    if (e.key === 'Enter') sendMessage();
  });

  // マイク入力
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.lang = currentLang === 'ja' ? 'ja-JP' : 'en-US';
    recognition.interimResults = false;
    btnVoice.addEventListener('click', () => {
      recognition.start();
    });
    recognition.onresult = e => {
      inputMsg.value = e.results[0][0].transcript;
      sendMessage();
    };
  }

  // メッセージ送信処理
  function sendMessage() {
    const text = inputMsg.value.trim();
    if (!text) return;
    appendMessage('user', text);
    inputMsg.value = '';
    fetch(`${socketUrl}?lang=${currentLang}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    .then(res => res.json())
    .then(data => {
      appendMessage('bot', data.reply);
      speakText(data.reply);
      // ログ送信
      fetch('/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: '訪問介護士',
          timestamp: new Date().toISOString(),
          input: text,
          reply: data.reply
        })
      });
    })
    .catch(console.error);
  }

  // メッセージをチャット窓に追加
  function appendMessage(sender, text) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    msg.textContent = text;
    chatWindow.appendChild(msg);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  // TTS 読み上げ
  function speakText(text) {
    if (!tts) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = currentLang === 'ja' ? 'ja-JP' : 'en-US';
    tts.speak(utter);
  }
});
