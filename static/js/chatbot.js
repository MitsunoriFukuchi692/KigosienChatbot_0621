let chatContainer = document.getElementById("chat-container");
let termResult = document.getElementById("term-result");

function sendMessage(role) {
  const input = document.getElementById(`input-${role}`);
  const message = input.value.trim();
  if (!message) return;

  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${role}`;
  bubble.textContent = `${role === "caregiver" ? "介護士" : "被介護者"}：${message}`;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  input.value = "";

  // 音声読み上げ
  const utter = new SpeechSynthesisUtterance(message);
  utter.lang = "ja-JP";
  speechSynthesis.speak(utter);
}

function startRecognition(role) {
  if (!('webkitSpeechRecognition' in window)) return;
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.start();
  recognition.onresult = function (e) {
    document.getElementById(`input-${role}`).value = e.results[0][0].transcript;
  };
}

function explainTerm() {
  const term = document.getElementById("term-input").value.trim();
  if (!term) return;
  fetch("/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term })
  })
  .then(res => res.json())
  .then(data => {
    termResult.textContent = data.explanation || "説明できませんでした。";
  });
}

function saveLog() {
  const lines = Array.from(chatContainer.children).map(div => div.textContent);
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "chat_log.txt";
  a.click();
}

// テンプレート例（カテゴリ毎に追加可能）
const templates = {
  caregiver: {
    "体調": ["体調はどうですか？", "痛みはありますか？"],
    "食事": ["ご飯は食べましたか？", "食欲はありますか？"]
  },
  patient: {
    "返事": ["はい、元気です", "いいえ、少し痛いです"]
  }
};

function loadTemplates() {
  ["caregiver", "patient"].forEach(role => {
    const container = document.getElementById(`${role}-templates`);
    Object.entries(templates[role]).forEach(([category, phrases]) => {
      const btn = document.createElement("button");
      btn.textContent = category;
      btn.onclick = () => {
        container.innerHTML = "";
        phrases.forEach(phrase => {
          const sub = document.createElement("button");
          sub.textContent = phrase;
          sub.onclick = () => {
            document.getElementById(`input-${role}`).value = phrase;
          };
          container.appendChild(sub);
        });
      };
      container.appendChild(btn);
    });
  });
}
document.addEventListener("DOMContentLoaded", loadTemplates);
