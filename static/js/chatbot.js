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
  // デバッグ用にレスポンスをログ
  console.log('🔍 API call:', { message, role });
  const res = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, role })
  });
  const data = await res.json();
  console.log('🔍 API response:', data);

  // v1 フォーマットにも対応し、NULLISH COALESCING で必ず文字列を返す
  const content = data.choices?.[0]?.message?.content
                ?? data.reply
                ?? data.message
                ?? data.text;
  return content ?? '(返答なし)';
}

// 介護士→AI（patient ロール）＋表示
async function sendCaregiverMessage() {
  const msg = caregiverInput.value.trim();
  if (!msg) return;
  appendChatLine('介護士', msg);
  caregiverInput.value = '';

  const reply = await callApi(msg, 'caregiver');
  appendChatLine('被介護者', reply);
}

// 被介護者→AI（caregiver ロール）＋表示
async function sendPatientMessage() {
  const msg = patientInput.value.trim();
  if (!msg) return;
  appendChatLine('被介護者', msg);
  patientInput.value = '';

  const reply = await callApi(msg, 'patient');
  appendChatLine('介護士', reply);
}

// ボタンへの紐づけ（もしonclickでなくaddEventListenerを使う場合）
document.getElementById('send-caregiver').addEventListener('click', sendCaregiverMessage);
document.getElementById('send-patient').addEventListener('click', sendPatientMessage);
