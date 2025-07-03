// chatbot.js

// DOM Elements
const chatWindow      = document.getElementById("chat-window");
const caregiverInput  = document.getElementById("caregiver-input");
const patientInput    = document.getElementById("patient-input");
const volumeControl   = document.getElementById("volume-control");
const speedControl    = document.getElementById("speed-control");

// Append message to chat window and speak
function appendMessage(sender, message) {
  const msgElem = document.createElement("div");
  msgElem.className = sender === "介護士" ? "message caregiver" : "message patient";
  msgElem.textContent = `${sender}：${message}`;
  chatWindow.appendChild(msgElem);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  speak(message);
}

// Send caregiver message
function sendCaregiverMessage() {
  const message = caregiverInput.value.trim();
  if (!message) {
    alert("入力が空です。テキストを入れてください。");
    return;
  }
  appendMessage("介護士", message);
  fetchResponse(message, "介護士");
  caregiverInput.value = "";
}

// Send patient message
function sendPatientMessage() {
  const message = patientInput.value.trim();
  if (!message) {
    alert("入力が空です。テキストを入れてください。");
    return;
  }
  appendMessage("被介護者", message);
  fetchResponse(message, "被介護者");
  patientInput.value = "";
}

// Fetch response from server
function fetchResponse(message, role) {
  // Build messages array
  const messages = [
    { role: "user", content: `${role}：${message}` }
  ];

  fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  })
    .then(res => res.json())
    .then(data => {
      const reply = data.response || (data.choices?.[0]?.message?.content) || "";
      const sender = role === "介護士" ? "被介護者" : "介護士";
      appendMessage(sender, reply);
    })
    .catch(err => {
      console.error("fetchResponse error:", err);
      appendMessage("システム", "メッセージの送信に失敗しました。");
    });
}

// Speech synthesis
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = parseFloat(volumeControl.value);
  utterance.rate   = parseFloat(speedControl.value);
  utterance.lang   = "ja-JP";
  speechSynthesis.speak(utterance);
}

// Initialize template buttons (assumes HTML has containers with these IDs)
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
      btn.className = "template-btn";
      btn.textContent = phrase;
      btn.onclick = () => {
        if (role === "介護士") caregiverInput.value = phrase;
        else                 patientInput.value   = phrase;
      };
      wrapper.appendChild(btn);
    });
    container.appendChild(wrapper);
  }
}

// Template definitions
const caregiverTemplates = {
  "体調": ["体調はいかがですか？", "痛いところはありますか？"],
  "薬":   ["お薬は飲みましたか？", "飲み忘れはありませんか？"],
  "排便": ["排便はありましたか？"],
  "睡眠": ["昨夜はよく眠れましたか？"],
  "食事": ["食事は完了しましたか？"]
};
const patientTemplates = {
  "体調": ["はい、体調は良好です。", "少し体に痛みがあります。"],
  "薬":   ["お薬は飲みました。", "飲み忘れました。"],
  "排便": ["排便はありました。"],
  "睡眠": ["昨夜はよく眠れました。"],
  "食事": ["食事を完了しました。"]
};

// Event bindings
document.addEventListener("DOMContentLoaded", () => {
  // Template buttons
  createTemplateButtons("介護士", caregiverTemplates, "caregiver-templates");
  createTemplateButtons("被介護者", patientTemplates, "patient-templates");

  // Send buttons
  document.getElementById("send-caregiver").onclick = sendCaregiverMessage;
  document.getElementById("send-patient").onclick   = sendPatientMessage;

  // Optional: Explain term button binding
  const explainBtn = document.getElementById("explain-btn");
  if (explainBtn) explainBtn.onclick = () => {
    const termInput = document.getElementById("term-input");
    const term = termInput.value.trim();
    if (!term) return;
    fetch('/explain', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ term })
    })
      .then(res => res.json())
      .then(data => {
        alert(`説明：${data.explanation}`);
        speak(data.explanation);
      });
  };
});