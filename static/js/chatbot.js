
const chatBox = document.getElementById('chat-box');
const caregiverInput = document.getElementById('caregiverInput');
const patientInput = document.getElementById('patientInput');

console.log("chatbot.js 最新バージョン読み込み確認");

function appendMessage(text, sender) {
  const msg = document.createElement('div');
  msg.className = sender;
  msg.innerText = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function getVolume() {
  return parseFloat(document.getElementById('volumeSlider').value);
}

function getRate() {
  return parseFloat(document.getElementById('rateSlider').value);
}

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.volume = getVolume();
  utter.rate = getRate();
  speechSynthesis.speak(utter);
}

function sendMessage() {
  const text = caregiverInput.value || patientInput.value;
  if (!text) return;
  appendMessage("👤 " + text, "user");
  fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })
  .then(res => res.json())
  .then(data => {
    appendMessage("🤖 " + data.reply, "bot");
    speak(data.reply);
  });
  caregiverInput.value = '';
  patientInput.value = '';
}

function sendTemplate(text) {
  appendMessage("📋 " + text, "user");
  speak(text);
}

function startRecognition() {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'ja-JP';
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    caregiverInput.value = text;
  };
  recognition.start();
}

function explainTerm() {
  const word = caregiverInput.value.trim();
  if (!word) return;
  fetch('/explain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word })
  })
  .then(res => res.json())
  .then(data => {
    appendMessage("📘 " + data.explanation, "bot");
    speak(data.explanation);
  });
}
