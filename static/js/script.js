// 完全一本化＆アイコン付き表示
const chatWindow = document.getElementById('lower-chat');
const sendBtn    = document.getElementById('lower-send');
const inputField = document.getElementById('lower-input');
const langSelect = document.getElementById('lang-select');
const micBtn     = document.getElementById('lower-mic');
const audioEl    = document.getElementById('audio-lower');

// HTMLエスケープ
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

// メッセージ追加（👤 / 🤖）
function appendMessage(sender, text) {
  const p = document.createElement('p');
  p.className = sender;
  const icon = sender === 'user' ? '👤' : '🤖';
  p.innerHTML = `${icon}: ${escapeHtml(text)}`;
  chatWindow.appendChild(p);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// 最後のBOTメッセージを置換
function replaceLastBotMessage(text) {
  const msgs = chatWindow.getElementsByClassName('bot');
  const last = msgs[msgs.length - 1];
  last.innerHTML = `🤖: ${escapeHtml(text)}`;
}

// 送信ボタン・Enterキー
sendBtn.addEventListener('click', () => {
  const text = inputField.value.trim(); if (!text) return;
  appendMessage('user', text);
  inputField.value = '';
  callChatAPI(text);
});
inputField.addEventListener('keydown', e => { if (e.key === 'Enter') sendBtn.click(); });

// 音声認識→送信
micBtn.addEventListener('click', () => {
  startSpeechRecognition()
    .then(t => { inputField.value = t; sendBtn.click(); })
    .catch(console.error);
});

// チャットAPI呼び出し
async function callChatAPI(text) {
  appendMessage('bot', '…考え中…');
  try {
    const res = await fetch('/chat', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ text, lang: langSelect.value })
    });
    const { reply } = await res.json();
    replaceLastBotMessage(reply);
    callTTS(reply, langSelect.value, audioEl);
  } catch (e) {
    console.error(e);
    replaceLastBotMessage('エラーが発生しました');
  }
}

// TTS
async function callTTS(text, lang, audioEl) {
  try {
    const res = await fetch('/tts', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ text, lang })
    }); if (!res.ok) throw new Error();
    const blob = await res.blob();
    audioEl.src = URL.createObjectURL(blob);
    await audioEl.play();
  } catch (err) {
    console.error('Audio再生エラー:', err);
  }
}

// 音声認識
function startSpeechRecognition() {
  return new Promise((resolve, reject) => {
    const R = new (window.SpeechRecognition||window.webkitSpeechRecognition)();
    R.lang = langSelect.value === 'ja' ? 'ja-JP' : 'en-US';
    R.start();
    R.onresult = e => resolve(e.results[0][0].transcript);
    R.onerror  = e => reject(e.error);
  });
}