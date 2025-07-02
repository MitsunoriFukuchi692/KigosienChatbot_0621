// chatbot.js 完全版

const chatWindow = document.getElementById("chat-window");
const caregiverInput = document.getElementById("caregiver-input");
const patientInput = document.getElementById("patient-input");
const explanationInput = document.getElementById("explanation-input");
const explanationText = document.getElementById("explanation-text");
const volumeControl = document.getElementById("volume-control");
const speedControl = document.getElementById("speed-control");

let conversationLog = [];

const categories = {
  体調: ["体調はどうですか？", "気になるところはありますか？"],
  薬: ["お薬は飲みましたか？", "飲み忘れはありませんか？"],
  排便: ["今日は排便がありましたか？", "便通に問題はありませんか？"],
  睡眠: ["昨夜はよく眠れましたか？", "眠りに問題はありませんか？"],
  食事: ["食事は済みましたか？", "食欲はありますか？"]
};

function appendMessage(sender, message) {
  const div = document.createElement("div");
  div.className = `message ${sender}`;
  div.textContent = `${sender === "caregiver" ? "介護士" : "被介護者"}：${message}`;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  conversationLog.push(`${sender === "caregiver" ? "介護士" : "被介護者"}：${message}`);
  speakText(message);
}

function sendMessage(sender) {
  const input = sender === "caregiver" ? caregiverInput : patientInput;
  const message = input.value.trim();
  if (message) {
    appendMessage(sender, message);
    input.value = "";
  }
}

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.volume = parseFloat(volumeControl.value);
  utterance.rate = parseFloat(speedControl.value);
  speechSynthesis.speak(utterance);
}

function startCaregiverRecognition() {
  startSpeechRecognition(caregiverInput);
}

function startPatientRecognition() {
  startSpeechRecognition(patientInput);
}

function startSpeechRecognition(targetInput) {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "ja-JP";
  recognition.onresult = function (event) {
    targetInput.value = event.results[0][0].transcript;
  };
  recognition.start();
}

function explainTerm() {
  const term = explanationInput.value.trim();
  if (!term) return;
  fetch("/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term })
  })
    .then(res => res.json())
    .then(data => {
      explanationText.textContent = data.explanation;
      speakText(data.explanation);
    })
    .catch(() => {
      explanationText.textContent = "説明の取得に失敗しました。";
    });
}

function saveLog() {
  const blob = new Blob([conversationLog.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "conversation_log.txt";
  a.click();
}

function createTemplateButtons() {
  const caregiverArea = document.getElementById("caregiver-templates");
  const patientArea = document.getElementById("patient-templates");

  Object.entries(categories).forEach(([category, phrases]) => {
    const div1 = document.createElement("div");
    const div2 = document.createElement("div");
    phrases.forEach(phrase => {
      const btn1 = document.createElement("button");
      btn1.textContent = phrase;
      btn1.onclick = () => {
        caregiverInput.value = phrase;
        sendMessage("caregiver");
      };
      div1.appendChild(btn1);

      const btn2 = document.createElement("button");
      btn2.textContent = phrase;
      btn2.onclick = () => {
        patientInput.value = phrase;
        sendMessage("patient");
      };
      div2.appendChild(btn2);
    });
    caregiverArea.appendChild(div1);
    patientArea.appendChild(div2);
  });
}

window.onload = createTemplateButtons;
