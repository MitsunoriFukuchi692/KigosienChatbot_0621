// chat_interface.js

document.addEventListener("DOMContentLoaded", () => {
  const chatContainer = document.getElementById("chat-container");
  const inputField = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const micButton = document.getElementById("mic-button");
  let recognition;
  let recognizing = false;

  // Web Speech API 初期化
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      recognizing = true;
      micButton.classList.add('listening');
    };

    recognition.onend = () => {
      recognizing = false;
      micButton.classList.remove('listening');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputField.value = transcript;
      sendMessage();
    };
  } else {
    micButton.disabled = true;
    console.warn("Speech Recognition API not supported in this browser.");
  }

  // マイクのオン/オフ
  micButton.addEventListener('click', () => {
    if (!recognition) return;
    recognizing ? recognition.stop() : recognition.start();
  });

  // メッセージ送信（ボタンクリック or Enter）
  sendButton.addEventListener('click', sendMessage);
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // メッセージ送信処理
  function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    appendMessage('user', text);
    inputField.value = '';

    // タイピングインジケーター
    const loadingElem = document.createElement('div');
    loadingElem.className = 'message bot loading';
    loadingElem.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatContainer.appendChild(loadingElem);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // バックエンドへ送信
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    .then(res => res.json())
    .then(data => {
      console.log('★ reply from server:', data.reply);
      chatContainer.removeChild(loadingElem);
      appendMessage('bot', data.reply);

      // 音声URLがあれば再生
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play().catch(err => console.warn('Audio playback failed', err));
      }
    })
    .catch(err => {
      console.error('Error:', err);
      chatContainer.removeChild(loadingElem);
      appendMessage('bot', '申し訳ありません。エラーが発生しました。');
    });
  }

  // メッセージ表示ヘルパー
  function appendMessage(role, text) {
    const elem = document.createElement('div');
    elem.className = `message ${role}`;
    elem.textContent = text;
    chatContainer.appendChild(elem);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
});