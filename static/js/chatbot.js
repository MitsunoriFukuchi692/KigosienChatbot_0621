// static/js/chatbot.js

document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  const input         = document.getElementById('chat-input');
  const sendBtn       = document.getElementById('send-btn');
  const voiceBtn      = document.getElementById('voice-btn');
  const langSelect    = document.getElementById('lang-select'); // あれば
  const ttsBar        = document.getElementById('tts-bar');
  const catDiv        = document.getElementById('template-categories');
  const phraseDiv     = document.getElementById('template-phrases');

  // テンプレ取得（省略）

  // ── 音声入力の初期化 ─────────────────────────
  let recognition;
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = e => {
      input.value = e.results[0][0].transcript;
    };
    recognition.onerror = err => console.error('SpeechRecognition:', err);
  } else {
    voiceBtn.style.display = 'none';  // 非対応は非表示
  }

  voiceBtn.addEventListener('click', () => {
    if (!recognition) return;
    // 言語選択があれば反映
    if (langSelect) {
      recognition.lang = langSelect.value === 'en' ? 'en-US' : 'ja-JP';
    }
    recognition.start();
  });
  // ────────────────────────────────────────────

  // ── メッセージ送信／表示 ────────────────────
  sendBtn.addEventListener('click', async () => {
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    // ユーザーのバブル（アイコン付き）
    const userDiv = document.createElement('div');
    userDiv.className = 'bubble user';
    userDiv.innerHTML = '<img class="icon" src="/static/img/user-icon.png" alt="user"><span>' + msg + '</span>';
    chatContainer.appendChild(userDiv);

    // サーバーへ送信
    const payload = { text: msg, lang: langSelect ? langSelect.value : 'ja' };
    const res = await fetch('/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const { reply, error } = await res.json();

    // ボットのバブル（アイコン付き）
    const botMsg = reply || error;
    const botDiv = document.createElement('div');
    botDiv.className = 'bubble bot';
    botDiv.innerHTML = '<img class="icon" src="/static/img/bot-icon.png" alt="bot"><span>' + botMsg + '</span>';
    chatContainer.appendChild(botDiv);

    chatContainer.scrollTop = chatContainer.scrollHeight;

    // TTS
    if (reply && window.speechSynthesis) {
      const utter = new SpeechSynthesisUtterance(reply);
      utter.lang = langSelect && langSelect.value==='en' ? 'en-US':'ja-JP';
      utter.onstart = () => ttsBar.classList.remove('hidden');
      utter.onend   = () => ttsBar.classList.add('hidden');
      window.speechSynthesis.speak(utter);
    }
  });
  // ────────────────────────────────────────────
});
