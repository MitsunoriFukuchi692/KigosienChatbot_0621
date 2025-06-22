// static/js/chatbot.js

// ページロード時に音声合成エンジンをウォームアップ
if ('speechSynthesis' in window) {
  // 初回 getVoices 呼び出し
  window.speechSynthesis.getVoices();
  // 音声データの更新があれば再取得
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const catDiv       = document.getElementById('template-categories');
  const phraseDiv    = document.getElementById('template-phrases');
  const chatContainer= document.getElementById('chat-container');
  const input        = document.getElementById('chat-input');
  const sendBtn      = document.getElementById('send-btn');
  const ttsBar       = document.getElementById('tts-bar');

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

    // ユーザー操作トリガーとして音声合成をウォームアップ（モバイルでの初回無音再生対策）
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

    // サーバへ送信
    fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    })
      .then(res => res.json())
      .then(json => {
        // ボットメッセージを表示
        const botBubble = document.createElement('div');
        botBubble.className = 'bubble bot';
        botBubble.textContent = json.reply;
        chatContainer.appendChild(botBubble);
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // 読み上げ機能
        if ('speechSynthesis' in window) {
          const utter = new SpeechSynthesisUtterance(json.reply);
          utter.lang = 'ja-JP';
          // 読み上げ開始・終了でバーを表示/非表示
          utter.onstart = () => { ttsBar.classList.remove('hidden'); };
          utter.onend   = () => { ttsBar.classList.add('hidden'); };
          window.speechSynthesis.speak(utter);
        }
      })
      .catch(err => console.error('チャット送信エラー:', err));

    input.value = '';
  });
});
