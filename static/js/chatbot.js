// static/js/chatbot.js

const chatWindow     = document.getElementById('chat-window');
const caregiverInput = document.getElementById('caregiver-input');
const patientInput   = document.getElementById('patient-input');

function appendLine(role, text) {
  const line = document.createElement('div');
  line.textContent = `${role}: ${text}`;
  chatWindow.appendChild(line);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// API呼び出し
async function callChat(message, role) {
  console.log('▶️ callChat:', { message, role });
  const res = await fetch('chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, role })
  });
  const data = await res.json();
  console.log('◀️ response:', data);
  if (data.error) {
    appendLine('Error', data.error);
    return;
  }
  const reply = data.reply ?? '(返答なし)';
  return reply;
}

// 送信ボタンのハンドラ
document.getElementById('send-caregiver').addEventListener('click', async () => {
  const msg = caregiverInput.value.trim();
  if (!msg) return;
  appendLine('介護士', msg);
  caregiverInput.value = '';
  const r = await callChat(msg, 'caregiver');
  appendLine('被介護者', r);
});

document.getElementById('send-patient').addEventListener('click', async () => {
  const msg = patientInput.value.trim();
  if (!msg) return;
  appendLine('被介護者', msg);
  patientInput.value = '';
  const r = await callChat(msg, 'patient');
  appendLine('介護士', r);
});
