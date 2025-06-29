document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  const caregiverInput = document.getElementById('caregiver-input');
  const elderInput = document.getElementById('elder-input');
  const ttsPlayer = document.getElementById('tts-player');
  const templateContainer = document.getElementById('template-container');

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

    // ユーザー入力をTTSで読み上げ
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
      body: JSON.stringify({ term })
    });

    const data = await res.json();
    const botDiv = document.createElement('div');
    botDiv.className = 'bubble bot';
    botDiv.innerHTML = `<span>📘 ${data.explanation || data.error}</span>`;
    chatContainer.appendChild(botDiv);

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
      } catch (e) {
        console.error('Speech recognition start error:', e);
      }
    });

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      caregiverInput.value = transcript;
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended.');
    };
  }
});
