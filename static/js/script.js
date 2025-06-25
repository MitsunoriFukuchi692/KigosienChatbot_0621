// すべて下段チャット用に一本化
const chatWindow = document.getElementById('lower-chat');
const sendBtn = document.getElementById('lower-send');
const inputField = document.getElementById('lower-input');
const langSelect = document.getElementById('lang-select');
const micBtn = document.getElementById('lower-mic');
const audioEl = document.getElementById('audio-lower');

// メッセージ送信イベント
sendBtn.addEventListener('click', () => {
  const text = inputField.value.trim();
  if (!text) return;
  appendMessage('user', text);
  inputField.value = '';
  callChatAPI(text);
});

inputField.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendBtn.click();
});

// 音声入力 (Web Speech API)
micBtn.addEventListener('click', () => {
  startSpeechRecognition()
    .then((transcript) => {
      inputField.value = transcript;
      sendBtn.click();
    })
    .catch(console.error);
});

// チャットAPI呼び出し
async function callChatAPI(text) {
  appendMessage('bot', '…考え中…');
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang: langSelect.value })
    });
    const data = await res.json();
    replaceLastBotMessage(data.reply);
    // 音声再生
    callTTS(data.reply, langSelect.value, audioEl);
  } catch (err) {
    console.error(err);
    replaceLastBotMessage('エラーが発生しました');
  }
}

// メッセージ表示ユーティリティ
function appendMessage(sender, text) {
  const p = document.createElement('p');
  p.className = sender;
  p.textContent = text;
  chatWindow.appendChild(p);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function replaceLastBotMessage(text) {
  const msgs = chatWindow.getElementsByClassName('bot');
  const last = msgs[msgs.length - 1];
  last.textContent = text;
}

// TTS 呼び出し
async function callTTS(text, lang, audioEl) {
  try {
    const res = await fetch('/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang })
    });
    if (!res.ok) throw new Error('TTS リクエスト失敗');
    const blob = await res.blob();
    audioEl.src = URL.createObjectURL(blob);
    await audioEl.play();
  } catch (err) {
    console.error('Audio再生エラー:', err);
  }
}

// Web Speech API: 音声認識
function startSpeechRecognition() {
  return new Promise((resolve, reject) => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = langSelect.value || 'ja-JP';
    recognition.start();
    recognition.onresult = (e) => resolve(e.results[0][0].transcript);
    recognition.onerror = (e) => reject(e.error);
  });
}
