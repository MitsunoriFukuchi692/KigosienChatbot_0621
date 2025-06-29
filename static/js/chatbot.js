document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  const caregiverInput = document.getElementById('caregiver-input');
  const elderInput = document.getElementById('elder-input');
  const ttsPlayer = document.getElementById('tts-player');
  const explainBtn = document.getElementById('explain-btn');
  const explainInput = document.getElementById('explain-input');
  const volumeSlider = document.getElementById('volume-slider');
  const slowToggle = document.getElementById('slow-toggle');
  const micStartBtn = document.getElementById('mic-start');
  const micRoleSelect = document.getElementById('mic-role');
  const downloadBtn = document.getElementById('download-log');
  const templateContainer = document.getElementById('template-container');

  let conversationLog = [];

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
    userDiv.className = `bubble user ${role}`;
    userDiv.innerHTML = `<span>${role === 'caregiver' ? '🧑‍⚕️' : '👵'} ${msg}</span>`;
    chatContainer.appendChild(userDiv);

    conversationLog.push({ role, message: msg, time: new Date().toISOString() });
    chatContainer.scrollTop = chatContainer.scrollHeight;
  };

  explainBtn.addEventListener('click', async () => {
    const term = explainInput.value.trim();
    if (!term) return;
    explainInput.value = '';

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

    conversationLog.push({ role: 'bot', message: data.explanation || data.error, time: new Date().toISOString() });
    chatContainer.scrollTop = chatContainer.scrollHeight;

    const ttsRes = await fetch('/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: data.explanation, lang: 'ja', slow: slowToggle.checked, volume: volumeSlider.value })
    });

    const blob = await ttsRes.blob();
    ttsPlayer.src = URL.createObjectURL(blob);
    ttsPlayer.play();
  });

  micStartBtn.addEventListener('click', () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const role = micRoleSelect.value;
      if (role === 'caregiver') caregiverInput.value = transcript;
      else elderInput.value = transcript;
    };
    recognition.start();
  });

  downloadBtn.addEventListener('click', () => {
    const bom = '\uFEFF';
    const csvContent = 'data:text/csv;charset=utf-8,' + bom +
      '時刻,話者,発言\n' +
      conversationLog.map(e => `${e.time},${e.role},"${e.message.replace(/"/g, '""')}"`).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'conversation_log.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});
