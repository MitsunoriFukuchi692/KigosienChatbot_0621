document.getElementById("chat-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const input = document.getElementById("message");
  const message = input.value;
  appendMessage("🧑", message);
  input.value = "";

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: message }),
  });

  const data = await res.json();
  appendMessage("🤖", data.reply);
});

function appendMessage(sender, message) {
  const box = document.getElementById("chat-box");
  const msg = document.createElement("div");
  msg.textContent = `${sender}：${message}`;
  box.appendChild(msg);
  box.scrollTop = box.scrollHeight;
}

// 音声入力機能の追加
const micBtn = document.getElementById("mic-btn");
const recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (recognition) {
  const recog = new recognition();
  recog.lang = "ja-JP";
  recog.continuous = false;

  micBtn.addEventListener("click", () => {
    recog.start();
    micBtn.textContent = "🎙️ 聞き取り中...";
  });

  recog.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById("message").value = transcript;
    micBtn.textContent = "🎤";
  };

  recog.onerror = (event) => {
    console.error("音声認識エラー:", event.error);
    micBtn.textContent = "🎤";
  };

  recog.onend = () => {
    micBtn.textContent = "🎤";
  };
} else {
  micBtn.disabled = true;
  micBtn.textContent = "🎤(非対応)";
}
