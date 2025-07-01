// static/js/chatbot.js
let currentVolume = 1.0;
let currentRate = 1.0;

document.getElementById("volumeSlider").addEventListener("input", (e) => {
  currentVolume = parseFloat(e.target.value);
});

document.getElementById("rateSlider").addEventListener("input", (e) => {
  currentRate = parseFloat(e.target.value);
});

function appendMessage(sender, text) {
  const box = document.getElementById("chat-box");
  const div = document.createElement("div");
  div.className = sender;
  div.textContent = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

async function sendMessage() {
  const caregiver = document.getElementById("caregiverInput").value.trim();
  const patient = document.getElementById("patientInput").value.trim();
  const message = caregiver || patient;
  if (!message) return;

  appendMessage("user", message);

  const res = await fetch("/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({message})
  });
  const data = await res.json();
  appendMessage("bot", data.reply);
  playTTS(data.reply);
}

async function sendTemplate(text) {
  appendMessage("user", text);
  const res = await fetch("/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({message: text})
  });
  const data = await res.json();
  appendMessage("bot", data.reply);
  playTTS(data.reply);
}

async function explainTerm() {
  const term = prompt("説明したい用語を入力してください:");
  if (!term) return;
  const res = await fetch("/explain", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({term})
  });
  const data = await res.json();
  appendMessage("bot", data.explanation);
  playTTS(data.explanation);
}

async function playTTS(text) {
  const res = await fetch("/tts", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      text: text,
      lang: "ja-JP",
      rate: currentRate
    })
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = currentVolume;
  audio.play();
}

function startRecognition() {
  if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
    alert("音声認識がサポートされていません。");
    return;
  }

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "ja-JP";
  recognition.start();

  recognition.onresult = function(event) {
    document.getElementById("caregiverInput").value = event.results[0][0].transcript;
  };
}
