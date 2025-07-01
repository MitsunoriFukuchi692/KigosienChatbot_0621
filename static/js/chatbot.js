// chatbot.js

// 送信用関数（既存の sendMessage を利用）
function sendMessage() {
    const input = document.getElementById("user-input").value;
    if (!input) return;

    appendMessage("あなた", input);
    document.getElementById("user-input").value = "";

    fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: input })
    })
    .then(response => response.json())
    .then(data => {
        appendMessage("みまくん", data.response);
        speakText(data.response);
    });
}

// テンプレートボタンからの送信用
function sendTemplate(text) {
    document.getElementById("user-input").value = text;
    sendMessage();
}

// メッセージをチャット欄に追加
function appendMessage(sender, text) {
    const chatBox = document.getElementById("chat-box");
    const messageDiv = document.createElement("div");
    messageDiv.className = sender === "あなた" ? "user-message" : "bot-message";
    messageDiv.textContent = sender + ": " + text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 音声読み上げ
function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.volume = 1.0;
    utterance.rate = 1.0;
    speechSynthesis.speak(utterance);
}
