// chatbot.js（修正版）

const caregiverInput = document.getElementById("caregiver-input");
const patientInput = document.getElementById("patient-input");
const chatWindow = document.getElementById("chat-window");
const explanationInput = document.getElementById("explanation-input");
const explanationText = document.getElementById("explanation-text");
const volumeControl = document.getElementById("volume-control");
const speedControl = document.getElementById("speed-control");

function appendMessage(sender, message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message", sender === "介護士" ? "caregiver" : "patient");
  messageElement.textContent = `${sender}：${message}`;
  chatWindow.appendChild(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = parseFloat(volumeControl.value);
  utterance.rate = parseFloat(speedControl.value);
  utterance.lang = "ja-JP";
  speechSynthesis.speak(utterance);
}

function sendCaregiverMessage() {
  const message = caregiverInput.value;
  if (!message) return;
  appendMessage("介護士", message);
  caregiverInput.value = "";

  fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  })
    .then((response) => response.json())
    .then((data) => {
      const reply = data.reply || data.message || data.text || "（返答なし）";
      appendMessage("被介護者", reply);
      speak(reply);
    });
}

function sendPatientMessage() {
  const message = patientInput.value;
  if (!message) return;
  appendMessage("被介護者", message);
  patientInput.value = "";

  fetch("/chat_patient", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  })
    .then((response) => response.json())
    .then((data) => {
      const reply = data.reply || data.message || data.text || "（返答なし）";
      appendMessage("介護士", reply);
      speak(reply);
    });
}

function explainTerm() {
  const term = explanationInput.value;
  if (!term) return;

  fetch("/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term }),
  })
    .then((response) => response.json())
    .then((data) => {
      const explanation = data.explanation || data.reply || "（説明なし）";
      explanationText.textContent = explanation;
      speak(explanation);
    });
}

function saveLog() {
  const text = chatWindow.innerText;
  const blob = new Blob([text], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "chat_log.txt";
  link.click();
}

// 音声認識
function startCaregiverRecognition() {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.onresult = function (event) {
    caregiverInput.value = event.results[0][0].transcript;
  };
  recognition.start();
}

function startPatientRecognition() {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.onresult = function (event) {
    patientInput.value = event.results[0][0].transcript;
  };
  recognition.start();
}

// テンプレートの設定
const caregiverTemplates = [
  "体調はどうですか？",
  "お薬は飲みましたか？",
  "排便はありましたか？",
  "よく眠れましたか？",
  "食事は摂れましたか？"
];

const patientTemplates = [
  "元気です。",
  "薬は飲みました。",
  "まだ出ていません。",
  "よく眠れました。",
  "はい、食べました。"
];

function renderTemplates(buttons, templates, sender) {
  buttons.innerHTML = "";
  templates.forEach((text) => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.onclick = () => {
      if (sender === "caregiver") {
        caregiverInput.value = text;
      } else {
        patientInput.value = text;
      }
    };
    buttons.appendChild(btn);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderTemplates(document.getElementById("caregiver-templates"), caregiverTemplates, "caregiver");
  renderTemplates(document.getElementById("patient-templates"), patientTemplates, "patient");
});
