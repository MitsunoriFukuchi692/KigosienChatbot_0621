document.addEventListener('DOMContentLoaded', () => {
  const chatContainer = document.getElementById('chat-container');
  const caregiverInput = document.getElementById('caregiver-input');
  const elderInput = document.getElementById('elder-input');
  const ttsPlayer = document.getElementById('tts-player');
  const templateContainer = document.getElementById('template-container');
  const slowVoiceCheckbox = document.getElementById('slow-voice') || document.getElementById('slow-toggle');
  const volumeSlider = document.getElementById('volume-slider') || document.getElementById('volume-range');
  const micToggleBtn = document.getElementById('mic-toggle') || document.getElementById('start-record-btn');
  const micRoleSelect = document.getElementById('mic-role');

  let recognition;
  let recognizing = false;
  const logs = [];

  // 音量調整
  ttsPlayer.volume = parseFloat(volumeSlider.value || 1);
  volumeSlider.addEventListener('input', () => {
    ttsPlayer.volume = parseFloat(volumeSlider.value);
  });

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
    userDiv.className = `bubble ${role === 'caregiver' ? 'caregiver' : 'elder'}`;
    userDiv.innerHTML = `<span>${role === 'caregiver' ? '🧑‍⚕️' : '👵'} ${msg}</span>`;
    chatContainer.appendChild(userDiv);

    logs.push({
      timestamp: new Date().toISOString(),
      sender: role,
      message: msg
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
    const explanation = data.explanation || data.error;

    const botDiv = document.createElement('div');
    botDiv.className = 'bubble bot';
    botDiv.innerHTML = `<span>📘 ${explanation}</span>`;
    chatContainer.appendChild(botDiv);

    logs.push({
      timestamp: new Date().toISOString(),
      sender: 'bot',
      message: explanation
    });

    const rate = slowVoiceCheckbox.checked ? 0.8 : 1.2;
    const ttsRes = await fetch('/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: explanation, lang: 'ja', rate })
    });
    const blob = await ttsRes.blob();
    ttsPlayer.src = URL.createObjectURL(blob);
    ttsPlayer.play();

    explainInput.value = '';
    chatContainer.scrollTop = chatContainer.scrollHeight;
  });

  window.downloadCSV = () => {
    const header = ['timestamp', 'sender', 'message'];
    const rows = logs.map(log => [log.timestamp, log.sender, log.message]);
    const csvContent = [header, ...rows]
      .map(row => row.map(field => `"${(field || '').replace(/"/g, '""')}"`).join(','))
      .join('\r\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 音声認識
  micToggleBtn.addEventListener('click', () => {
    if (!recognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return alert('音声認識がサポートされていません。');
      recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const role = micRoleSelect.value;
        const targetInput = role === 'caregiver' ? caregiverInput : elderInput;
        targetInput.value = transcript;
      };

      recognition.onerror = (event) => {
        console.error('音声認識エラー:', event.error);
      };
    }

    if (recognizing) {
      recognition.stop();
      micToggleBtn.textContent = '🎤 マイク開始';
    } else {
      recognition.start();
      micToggleBtn.textContent = '⏹️ マイク停止';
    }
    recognizing = !recognizing;
  });
});
