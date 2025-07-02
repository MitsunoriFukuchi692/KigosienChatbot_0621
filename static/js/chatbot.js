// chatbot.js
// --- 既存の設定や定義はそのまま ---
const chatContainer = document.getElementById('chat-container');
let currentSpeaker = '介護士';

// メッセージ描画関数にデバッグロジックを追加
function appendChatLine(speaker, text) {
  if (!speaker) {
    console.error('⚠️ speaker is undefined!', { speaker, text });
    debugger; // 話者が undefined になる瞬間で停止
  }
  const line = document.createElement('p');
  line.textContent = `${speaker}: ${text}`;
  chatContainer.appendChild(line);
}

// 発話と音声合成をまとめて呼び出す関数
function appendMessage(text) {
  appendChatLine(currentSpeaker, text);
  speak(text);
}

// 介護士から被介護者、またはその逆への切り替え
function toggleSpeaker() {
  currentSpeaker = (currentSpeaker === '介護士') ? '被介護者' : '介護士';
}

// メッセージ送信イベント
document.getElementById('send-button').addEventListener('click', () => {
  const inputField = document.getElementById('message-input');
  const message = inputField.value.trim();
  if (!message) return;

  // 送信側の描画
  appendChatLine(currentSpeaker, message);
  inputField.value = '';

  // サーバーへリクエスト
  const role = (currentSpeaker === '介護士') ? 'caregiver' : 'patient';
  fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, role })
  })
  .then(response => response.json())
  .then(data => {
    console.log('🚀 /chat からの data:', data);
    // API v1 の choices[0].message.content または既存キーを優先取得
    const reply = data.choices?.[0]?.message?.content
                ?? data.reply
                ?? data.message
                ?? data.text
                ?? '(返答なし)';

    // 話者切り替え後に描画
    toggleSpeaker();
    appendMessage(reply);
  })
  .catch(err => console.error('通信エラー:', err));
});

// Web Speech API や TTS の speak() 実装は既存コードを利用
// 省略
