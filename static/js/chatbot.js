// chatbot.js（完全版）

let caregiverTemplates = {
  "体調": ["体調はいかがですか？", "痛いところはありますか？"],
  "薬": ["お薬は飲みましたか？", "飲み忘れはありませんか？"],
  "排便": ["今日は排便がありましたか？"],
  "睡眠": ["昨夜はよく眠れましたか？"],
  "食事": ["ご飯は食べましたか？"]
};

let patientTemplates = {
  "体調": ["少し痛みがあります。", "元気です。"],
  "薬": ["薬は飲みました。", "まだ飲んでいません。"],
  "排便": ["今朝ありました。", "昨日からありません。"],
  "睡眠": ["よく眠れました。", "あまり眠れませんでした。"],
  "食事": ["食べました。", "まだ食べていません。"]
};

const chatWindow = document.getElementById("chat-window");
const caregiverInput = document.getElementById("caregiver-input");
const patientInput = document.getElementById("patient-input");

const volumeControl = document.getElementById("volume-control");
const speedControl = document.getElementById("speed-control");

function appendMessage(sender, message) {
  const msgElem = document.createElement("div");
  msgElem.className = sender === "介護士" ? "message caregiver" : "message patient";
  msgElem.textContent = `${sender}：${message}`;
  chatWindow.appendChild(msgElem);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  speak(message);
}

function sendCaregiverMessage() {
  const message = caregiverInput.value.trim();
  if (message) {
    appendMessage("介護士", message);
    fetchResponse(message, "介護士");
    caregiverInput.value = "";
  }
}

function sendPatientMessage() {
  const message = patientInput.value.trim();
  if (message) {
    appendMessage("被介護者", message);
    fetchResponse(message, "被介護者");
    patientInput.value = "";
  }
}

function fetchResponse(message, role) {
  fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, role })
  })
    .then(res => res.json())
    .then(data => appendMessage(role === "介護士" ? "被介護者" : "介護士", data.response))
    .catch(err => console.error(err));
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = parseFloat(volumeControl.value);
  utterance.rate = parseFloat(speedControl.value);
  utterance.lang = "ja-JP";
  speechSynthesis.speak(utterance);
}

function explainTerm() {
  const term = document.getElementById("explanation-input").value.trim();
  if (!term) return;
  fetch("/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("explanation-text").textContent = data.explanation;
      speak(data.explanation);
    });
}

function createTemplateButtons(role, templates, containerId) {
  const container = document.getElementById(containerId);
  for (const category in templates) {
    const wrapper = document.createElement("div");
    wrapper.className = "template-group";
    const label = document.createElement("strong");
    label.textContent = category;
    wrapper.appendChild(label);
    templates[category].forEach(phrase => {
      const btn = document.createElement("button");
      btn.textContent = phrase;
      btn.onclick = () => {
        if (role === "介護士") {
          caregiverInput.value = phrase;
        } else {
          patientInput.value = phrase;
        }
      };
      wrapper.appendChild(btn);
    });
    container.appendChild(wrapper);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  createTemplateButtons("介護士", caregiverTemplates, "caregiver-templates");
  createTemplateButtons("被介護者", patientTemplates, "patient-templates");
});
