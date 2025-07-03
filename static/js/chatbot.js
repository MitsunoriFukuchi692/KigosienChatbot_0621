// chatbot.js

window.onerror = function(message, source, lineno, colno, error) {
  alert(
    "★JS エラー検出★\n" +
    "メッセージ: " + message + "\n" +
    "ファイル: " + source + "\n" +
    "行番号: " + lineno + ", 列番号: " + colno
  );
};

// DOM Elements
const chatWindow      = document.getElementById("chat-container");
const caregiverInput  = document.getElementById("caregiver-input");
const patientInput    = document.getElementById("patient-input");
const volumeControl   = document.getElementById("volume-slider");
const speedControl    = document.getElementById("rate-slider");

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let activeRole = null;
if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = 'ja-JP';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;
    if (activeRole === '介護士') caregiverInput.value = transcript;
    if (activeRole === '被介護者') patientInput.value = transcript;
  });
  recognition.addEventListener('error', (e) => console.error('SpeechRecognition error', e));
}

// Append message to chat window and speak
function appendMessage(sender, message) {
  const msgElem = document.createElement("div");
  msgElem.className = sender === "介護士" ? "message caregiver" : "message patient";
  msgElem.textContent = `${sender}：${message}`;
  chatWindow.appendChild(msgElem);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  speak(message);
}

// Send caregiver message (no AI response)
function sendCaregiverMessage() {
  const message = caregiverInput.value.trim();
  if (!message) {
    alert("入力が空です。テキストを入れてください。");
    return;
  }
  appendMessage("介護士", message);
  caregiverInput.value = "";
}

// Send patient message (no AI response)
function sendPatientMessage() {
  const message = patientInput.value.trim();
  if (!message) {
    alert("入力が空です。テキストを入れてください。");
    return;
  }
  appendMessage("被介護者", message);
  patientInput.value = "";
}

// Speech synthesis
function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = parseFloat(volumeControl.value);
  utterance.rate   = parseFloat(speedControl.value);
  utterance.lang   = "ja-JP";
  speechSynthesis.speak(utterance);
}

// Initialize template buttons and debug handlers
document.addEventListener("DOMContentLoaded", () => {
  // Template buttons
  createTemplateButtons("介護士", caregiverTemplates, "caregiver-templates");
  createTemplateButtons("被介護者", patientTemplates, "patient-templates");

  // Send buttons
  document.getElementById("send-caregiver").onclick = sendCaregiverMessage;
  document.getElementById("send-patient").onclick   = sendPatientMessage;

  // Mic buttons with debug
  document.querySelectorAll('.mic-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Mic button clicked for role:', btn.dataset.role);
      if (!recognition) {
        alert('お使いのブラウザは音声認識に対応していません');
        return;
      }
      activeRole = btn.dataset.role;
      try {
        recognition.start();
      } catch (e) {
        console.error('Recognition start error:', e);
      }
    });
  });

  // Debug speech recognition events
  if (recognition) {
    recognition.addEventListener('start', () => console.log('Speech recognition started'));
    recognition.addEventListener('end', () => console.log('Speech recognition ended'));
    recognition.addEventListener('result', (e) => console.log('Speech recognition result event', e));
    recognition.addEventListener('error', (e) => console.error('SpeechRecognition error', e));
  }

  // Explain term button with debug
  const explainBtn = document.getElementById("explain-btn");
  if (explainBtn) {
    explainBtn.onclick = () => {
      const termInput = document.getElementById("term-input");
      const term = termInput.value.trim();
      if (!term) {
        alert('用語を入力してください');
        return;
      }
      console.log('Requesting explanation for term:', term);
      fetch('/explain', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ term })
      })
        .then(res => {
          console.log('Explain response status:', res.status);
          return res.json();
        })
        .then(data => {
          console.log('Explain response data:', data);
          const explanation = data.explanation || '';
          appendMessage("システム", `用語説明: ${explanation}`);
          speak(explanation);
        })
        .catch(err => console.error('Explain fetch error:', err));
    };
  }
});
