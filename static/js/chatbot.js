
let volume = 1;
let rate = 1;

document.getElementById("volumeSlider").addEventListener("input", (e) => {
  volume = parseFloat(e.target.value);
});

document.getElementById("rateSlider").addEventListener("input", (e) => {
  rate = parseFloat(e.target.value);
});

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = volume;
  utterance.rate = rate;
  speechSynthesis.speak(utterance);
}

function sendMessage(sender) {
  const inputId = sender === "caregiver" ? "caregiverInput" : "patientInput";
  const input = document.getElementById(inputId);
  const message = input.value.trim();
  if (!message) return;
  appendMessage(sender, message);
  speakText(message);
  input.value = "";
}

function sendTemplate(category) {
  const message = `[${category}] テンプレート発言です`;
  appendMessage("template", message);
  speakText(message);
}

function appendMessage(sender, message) {
  const container = document.getElementById("chatContainer");
  const div = document.createElement("div");
  div.className = "chat-message";
  div.textContent = sender + ": " + message;
  container.appendChild(div);
}

// 音声認識
function startRecognition() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'ja-JP';
  recognition.start();
  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById("caregiverInput").value = transcript;
  };
}
