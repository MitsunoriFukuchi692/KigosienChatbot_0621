// static/js/chatbot.js

// ページロード時に音声合成エンジンをウォームアップ
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const catDiv        = document.getElementById('template-categories');
  const phraseDiv     = document.getElementById('template-phrases');
  const chatContainer = document.getElementById('chat-container');
  const input         = document.getElementById('chat-input');
  const sendBtn       = document.getElementById('send-btn');
  const ttsBar        = document.getElementById('tts-bar');
  const langSelect    = document.getElementById('lang-select'); // 言語選択要素

  // テンプレート取得
  fetch('/templates')
    .then(res => res.json())
    .then(data => {
      data.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item.category;
        btn.addEventListener('click', () => {
          phraseDiv.innerHTML = '';
          item.phrases.forEach(phrase => {
            const pBtn = document.createElement('button');
            pBtn.textContent = phrase;
            pBtn.addEventListener('click', () => {
              input.value = phrase;
            });
            phraseDiv.appendChild(pBtn);
          });
        });
        catDiv.appendChild(btn);
      });
    })
    .catch(err => console.error('テンプレート取得エラー:', err));

  // メッセージ送信処理
  sendBtn.addEventListener('click', () => {
    const msg = input.value.trim();
    if (!msg) return;

    // モバイル初回無音再生対策
    if ('speechSynthesis' in window && !window._speechWarmUpDone) {
      const warmUp = new SpeechSynthesisUtterance('');
      warmUp.onend = () => { window._speechWarmUpDone = true; };
      window.speechSynthesis.speak(warmUp);
    }

    // ユーザーメッセージを表示
    const userBubble = document.createElement('div');
    userBubble.className = 'bubble user';
    userBubble.textContent = msg;
    chatContainer.appendChild(userBubble);

    // サーバへ送信（キーを text に合わせ、lang も追加）
    const payload = {
      text: msg,
      lang: langSelect ? langSelect.value : 'ja'
    };

    fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(json => {
        // 応答を表示
        const botBubble = document.createElement('div');
        botBubble.className = 'bubble bot';
        botBubble.textContent = json.reply || json.error;
        chatContainer.appendChild(botBubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // 読み上げ機能
        if ('speechSynthesis' in window && json.reply) {
          const utter = new SpeechSynthesisUtterance(json.reply);
          utter.lang = langSelect && langSelect.value === 'en' ? 'en-US' : 'ja-JP';
          utter.onstart = () => { ttsBar.classList.remove('hidden'); };
          utter.onend   = () => { ttsBar.classList.add('hidden'); };
          window.speechSynthesis.speak(utter);
        }
      })
      .catch(err => console.error('チャット送信エラー:', err));

    input.value = '';
  });
});
