// static/js/chatbot.js

const chatContainer = document.getElementById('chat-window');
const caregiverInput = document.getElementById('caregiver-input');
const patientInput   = document.getElementById('patient-input');

// メッセージ描画。speaker は必ず文字列で渡す
function appendChatLine(speaker, text) {
  const p = document.createElement('p');
  p.textContent = `${speaker}: ${text}`;
  chatContainer.appendChild(p);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ChatGPT へのリクエスト共通部
async function callApi(message, role) {
  const res = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, role })
  });
  const data = await res.json();
  // v1 フォーマットにも対応
  return (
    data.choices?.[0]?.message?.content ??
    data.reply ??
    data.message ??
    data.text ??
    '(返答なし)'
  );
}

// 介護士→AI（被介護者ロール）＋表示
async function sendCaregiverMessage() {
  const msg = caregiverInput.value.trim();
  if (!msg) return;
  appendChatLine('介護士', msg);
  caregiverInput.value = '';

  const reply = await callApi(msg, 'caregiver');
  appendChatLine('被介護者', reply);
}

// 被介護者→AI（介護士ロール）＋表示
async function sendPatientMessage() {
  const msg = patientInput.value.trim();
  if (!msg) return;
  appendChatLine('被介護者', msg);
  patientInput.value = '';

  const reply = await callApi(msg, 'patient');
  appendChatLine('介護士', reply);
}

// ボタンに紐づけ済みなので、addEventListener は不要です。
// もし onclick を外したい場合は、ここで紐づけてもOKです。
// document.getElementById('send-caregiver').addEventListener('click', sendCaregiverMessage);
// document.getElementById('send-patient').addEventListener('click',   sendPatientMessage);
