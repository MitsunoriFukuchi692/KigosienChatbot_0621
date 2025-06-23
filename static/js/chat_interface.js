document.addEventListener("DOMContentLoaded", () => {
  // 要素取得
  const chatContainer = document.getElementById("chat-container");
  const templateContainer = document.getElementById("template-container");
  const inputField = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const micButton = document.getElementById("mic-button");

  console.log("✅ chat_interface.js loaded!", new Date().toISOString());

  // 1. テンプレート取得・描画
  console.log("▶️ Fetching templates...");
  fetch("/templates")
    .then(res => res.json())
    .then(templates => {
      console.log("★ templates loaded:", templates);
      templates.forEach(group => {
        group.phrases.forEach(phrase => {
          const btn = document.createElement("button");
          btn.className = "template-btn";
          btn.textContent = phrase;
          btn.addEventListener("click", () => {
            inputField.value = phrase;
            inputField.focus();
          });
          templateContainer.appendChild(btn);
        });
      });
    })
    .catch(err => console.error("❌ templates fetch error:", err));

  // 2. SpeechRecognition セットアップ
  let recognition = null;
  const SR = (typeof window.SpeechRecognition === 'function'
    ? window.SpeechRecognition
    : (typeof window.webkitSpeechRecognition === 'function'
      ? window.webkitSpeechRecognition
      : null));

  if (SR) {
    try {
      recognition = new SR();
      recognition.lang = 'ja-JP';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onstart = () => micButton.classList.add('listening');
      recognition.onend = () => micButton.classList.remove('listening');
      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        inputField.value = transcript;
        sendMessage();
      };
    } catch (err) {
      console.warn('SpeechRecognition 初期化失敗:', err);
      recognition = null;
    }
  } else {
    console.warn('SpeechRecognition API がサポートされていません');
  }

  // マイクボタンの有効/無効設定
  if (!recognition) {
    micButton.disabled = true;
  } else {
    micButton.addEventListener('click', () => {
      if (micButton.classList.contains('listening')) {
        recognition.stop();
      } else {
        recognition.start();
      }
    });
  }

  // 3. 送信処理
  sendButton.addEventListener('click', sendMessage);
  inputField.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    appendMessage('user', text);
    inputField.value = '';

    // タイピングインジケーター
    const loading = document.createElement('div');
    loading.className = 'message bot loading';
    loading.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatContainer.appendChild(loading);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    console.log('▶️ fetch -> /api/chat', text);
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    .then(res => {
      console.log('◀️ status:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('★ reply:', data.reply);
      chatContainer.removeChild(loading);
      appendMessage('bot', data.reply);

      // audioUrl があれば <audio> 要素で再生バー付きで追加
      if (data.audioUrl) {
        console.log('★ audioUrl:', data.audioUrl);
        const audioElem = document.createElement('audio');
        audioElem.src = data.audioUrl;
        audioElem.controls = true;
        audioElem.autoplay = true;
        chatContainer.appendChild(audioElem);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    })
    .catch(err => {
      console.error('❌ fetch error:', err);
      chatContainer.removeChild(loading);
      appendMessage('bot', '申し訳ありません。エラーが発生しました。');
    });
  }

  // 4. メッセージ要素を追加するヘルパー
  function appendMessage(role, text) {
    const el = document.createElement('div');
    el.className = `message ${role}`;
    el.textContent = text;
    chatContainer.appendChild(el);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
});