// static/js/chatbot.js

const chatContainer = document.getElementById('chat-window');
const caregiverInput = document.getElementById('caregiver-input');
const patientInput   = document.getElementById('patient-input');

// メッセージ描画。speaker および text の undefined を防ぐ
function appendChatLine(speaker, text) {
  const safeSpeaker = speaker ?? '(no speaker)';
  const safeText = text ?? '(返答なし)';
  const p = document.createElement('p');
  p.textContent = `${safeSpeaker}: ${safeText}`;
  chatContainer.appendChild(p);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ChatGPT へのリクエスト共通部
async function callApi(message, role) {
  console.log('🔍 API call:', { message, role });
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, role })
    });
    const data = await res.json();
    console.log('🔍 API response (parsed):', data);

    // レスポンスに応じて適切なキーを参照
    let content =
      data.choices?.[0]?.message?.content ??
      data.choices?.[0]?.text ??
      data.reply ??
      data.message ??
      data.text;

    console.log('🔍 Parsed content:', content);
    return content ?? '(返答なし)';
  } catch (e) {
    console.error('🚨 callApi エラー:', e);
    return '(通信エラー)';
  }
}

// 介護士→AI（patient ロール）＋表示
async function sendCaregiverMessage() {
  const msg = caregiverInput.value.trim();
  if (!msg) return;
  appendChatLine('介護士', msg);
  caregiverInput.value = '';

  const reply = await callApi(msg, 'caregiver');
  console.log('🔍 Caregiver→Patient reply:', reply);
  appendChatLine('被介護者', reply);
}

// 被介護者→AI（caregiver ロール）＋表示
async function sendPatientMessage() {
  const msg = patientInput.value.trim();
  if (!msg) return;
  appendChatLine('被介護者', msg);
  patientInput.value = '';

  const reply = await callApi(msg, 'patient');
  console.log('🔍 Patient→Caregiver reply:', reply);
  appendChatLine('介護士', reply);
}

// ボタンへの紐づけ
document.getElementById('send-caregiver').addEventListener('click', sendCaregiverMessage);
document.getElementById('send-patient').addEventListener('click', sendPatientMessage);
