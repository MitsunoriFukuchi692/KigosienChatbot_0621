// chatbot対応 script.js

async function callTTS(text, lang = 'ja') {
  try {
    const res = await fetch('/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang })
    });
    if (!res.ok) throw new Error(`TTS API error ${res.status}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
  } catch (e) {
    console.error('TTS再生エラー:', e);
  }
}

async function sendChat(message, lang = 'ja') {
  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, lang })
    });
    const body = await res.json();
    if (!res.ok || !body.reply) {
      console.error('Chat API エラー:', body);
      return null;
    }
    return body.reply;
  } catch (e) {
    console.error('Fetch エラー:', e);
    return null;
  }
}

document.getElementById('send-button')?.addEventListener('click', async () => {
  const inputEl = document.getElementById('user-input');
  const container = document.getElementById('chat-container');
  const text = inputEl.value.trim();
  if (!text) return;

  container.innerHTML += `<div class="user-msg">👤 ${text}</div>`;
  inputEl.value = '';

  const reply = await sendChat(text, 'ja');
  if (reply) {
    container.innerHTML += `<div class="bot-msg">🤖 ${reply}</div>`;
    container.scrollTop = container.scrollHeight;
    callTTS(reply, 'ja');
  }
});

async function loadTemplates() {
  const container = document.getElementById('template-container');
  if (!container) return;

  try {
    const res = await fetch('/templates');
    const data = await res.json();

    for (const group of data) {
      for (const phrase of group.phrases) {
        const btn = document.createElement('button');
        btn.className = 'template-btn';
        btn.textContent = phrase;
        btn.dataset.msg = phrase;
        btn.onclick = () => {
          document.getElementById('user-input').value = phrase;
        };
        container.appendChild(btn);
      }
    }
  } catch (e) {
    console.error('テンプレート取得エラー:', e);
  }
}

window.addEventListener('DOMContentLoaded', loadTemplates);
