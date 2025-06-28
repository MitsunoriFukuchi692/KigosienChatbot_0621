document.addEventListener('DOMContentLoaded', () => {
  // 要素取得
  const voiceBtn      = document.getElementById('voice-btn');
  const sendBtn       = document.getElementById('send-btn');
  const inputField    = document.getElementById('chat-input');
  const chatContainer = document.getElementById('chat-container');

  // 存在チェック（デバッグ用）
  console.log('voiceBtn=', voiceBtn, 'sendBtn=', sendBtn, 'inputField=', inputField, 'chatContainer=', chatContainer);

  // --------- 音声認識のセットアップ ---------
  let recog = null;
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recog = new SR();
    recog.lang = 'ja-JP';
    recog.onresult = e => {
      inputField.value = e.results[0][0].transcript;
    };
    recog.onerror = e => console.error('認識エラー', e);
  } else {
    // 非対応ブラウザでは非表示
    voiceBtn.style.display = 'none';
  }

  voiceBtn.addEventListener('click', () => {
    if (recog) recog.start();
  });

  // --------- メッセージ送信＆返信処理 ---------
  async function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    appendMessage('user', text);
    inputField.value = '';

    // Chat API 呼び出し
    let botReply = '';
    try {
      const res = await fetch('/chat', {
        method:  'POST',
        headers: {'Content-Type':'application/json'},
        body:    JSON.stringify({ message: text }),
      });
      const data = await res.json();
      botReply = data.reply || '';
    } catch (err) {
      console.error('チャットAPIエラー', err);
      botReply = 'すみません、エラーが発生しました。';
    }

    appendMessage('bot', botReply);

    // TTS 呼び出し＆再生
    try {
      console.log('TTS 呼び出し:', botReply);
      const audioUrl = await callTTS(botReply, 'ja');
      const audio    = new Audio(audioUrl);
      await audio.play();
    } catch (err) {
      console.error('TTS再生エラー', err);
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  inputField.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
  });

  // --------- DOM にチャットを追加 ---------
  function appendMessage(who, text) {
    const wrap = document.createElement('div');
    wrap.className = `chat ${who}`;  // .chat.user, .chat.bot
    wrap.textContent = text;
    chatContainer.appendChild(wrap);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // --------- TTS 関数 ---------
  async function callTTS(text, lang='ja') {
    const res = await fetch('/tts', {
      method:  'POST',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify({ text, lang }),
    });
    if (!res.ok) throw new Error(`TTS API エラー ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }
});
