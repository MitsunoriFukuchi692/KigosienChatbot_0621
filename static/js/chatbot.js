document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  const caregiverInput = document.getElementById('caregiver-input');
  const elderInput = document.getElementById('elder-input');
  const ttsPlayer = document.getElementById('tts-player');

  // メッセージ送信関数（roleは 'caregiver' または 'elder'）
  window.sendMessage = async (role) => {
    const input = role === 'caregiver' ? caregiverInput : elderInput;
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    const userDiv = document.createElement('div');
    userDiv.className = 'bubble user';
    userDiv.innerHTML = `<span>🧑‍⚕️ ${msg}</span>`;
    chatContainer.appendChild(userDiv);

    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });

    const data = await res.json();
    const reply = data.reply || data.error;

    const botDiv = document.createElement('div');
    botDiv.className = 'bubble bot';
    botDiv.innerHTML = `<span>🤖 ${reply}</span>`;
    chatContainer.appendChild(botDiv);

    chatContainer.scrollTop = chatContainer.scrollHeight;

    // 音声合成
    const ttsRes = await fetch('/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: reply, lang: 'ja' })
    });

    const blob = await ttsRes.blob();
    ttsPlayer.src = URL.createObjectURL(blob);
    ttsPlayer.play();
  };

  // 用語説明機能
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
});
