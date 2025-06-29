document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  const caregiverInput = document.getElementById('caregiver-input');
  const elderInput = document.getElementById('elder-input');
  const ttsPlayer = document.getElementById('tts-player');
  const templateContainer = document.getElementById('template-container');
  const micTarget = document.getElementById('mic-target');

  const templates = [
    { label: '薬: お薬は飲みましたか？', text: 'お薬は飲みましたか？', role: 'caregiver' },
    { label: '体調: 調子はいかがですか？', text: '調子はいかがですか？', role: 'caregiver' },
    { label: '返答: はい、飲みました。', text: 'はい、飲みました。', role: 'elder' },
    { label: '返答: 少し熱があります。', text: '少し熱があります。', role: 'elder' }
  ];

  templates.forEach(t => {
    const btn = document.createElement('button');
    btn.textContent = t.label;
    btn.className = 'template-btn';
    btn.onclick = () => {
      const target = t.role === 'caregiver' ? caregiverInput : elderInput;
      target.value = t.text;
    };
    templateContainer.appendChild(btn);
  });

  window.sendMessage = async (role) => {
    const input = role === 'caregiver' ? caregiverInput : elderInput;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    const userDiv = document.createElement('div');
    userDiv.className = role === 'caregiver' ? 'bubble caregiver' : 'bubble elder';
    userDiv.innerHTML = `<span>${role === 'caregiver' ? '🧑‍⚕️' : '👵'} ${msg}</span>`;
    chatContainer.appendChild(userDiv);

    try {
      const ttsRes = await fetch('/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg, lang: 'ja' })
      });

      const blob = await ttsRes.blob();
      ttsPlayer.src = URL.createObjectURL(blob);
      ttsPlayer.play();
    } catch (e) {
      console.error('TTS error:', e);
    }

    await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });

    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  const explainBtn = document.getElementById('explain-btn');
  const explainInput = document.getElementById('explain-input');
  explainBtn.addEventListener('click', async () => {
    const term = explainInput.value.trim();
    if (!term) return;

    const res = await fetch('/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ term, prompt_hint: '高齢者にもわかるよう30秒以内で簡潔に' })
    });

    const data = await res.json();
    const explanation = data.explanation || data.error;

    const botDiv = document.createElement('div');
    botDiv.className = 'bubble bot';
    botDiv.innerHTML = `<span>📘 ${explanation}</span>`;
    chatContainer.appendChild(botDiv);

    try {
      const ttsRes = await fetch('/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: explanation, lang: 'ja' })
      });

      const blob = await ttsRes.blob();
      ttsPlayer.src = URL.createObjectURL(blob);
      ttsPlayer.play();
    } catch (e) {
      console.error('TTS error (explain):', e);
    }

    explainInput.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });

  const micButton = document.getElementById('mic-button');
  if (micButton) {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.continuous = false;

    micButton.addEventListener('click', () => {
      try {
        recognition.start();
        console.log('音声認識開始');
      } catch (e) {
        console.error('音声認識開始エラー:', e);
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const target = micTarget.value === 'elder' ? elderInput : caregiverInput;
      target.value = transcript;
      console.log(`音声認識結果（${micTarget.value}欄）:`, transcript);
    };

    recognition.onerror = (event) => {
      console.error('音声認識エラー:', event.error);
    };

    recognition.onend = () => {
      console.log('音声認識終了');
    };
  }
});
