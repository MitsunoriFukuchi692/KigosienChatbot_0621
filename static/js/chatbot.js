const caregiverInput = document.getElementById("input-caregiver");
const patientInput = document.getElementById("input-patient");
const chatArea = document.getElementById("chat-area");
const explanationText = document.getElementById("explanation-text");
const voiceSpeed = document.getElementById("voice-speed");
const voiceVolume = document.getElementById("voice-volume");

let recognition;

function appendMessage(role, text) {
  const message = document.createElement("div");
  message.className = role === "caregiver" ? "caregiver-message" : "patient-message";
  message.textContent = `${role === "caregiver" ? "介護士" : "被介護者"}：${text}`;
  chatArea.appendChild(message);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function sendMessage(role) {
  const input = role === "caregiver" ? caregiverInput : patientInput;
  const message = input.value.trim();
  if (!message) return;

  appendMessage(role, message);
  input.value = "";

  fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, message })
  })
    .then((res) => res.json())
    .then((data) => {
      appendMessage("bot", data.reply);
      speak(data.reply);
    });
}

function startRecognition(role) {
  if (!("webkitSpeechRecognition" in window)) {
    alert("音声認識はこのブラウザでサポートされていません。");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const input = role === "caregiver" ? caregiverInput : patientInput;
    input.value = transcript;
  };
  recognition.start();
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = parseFloat(voiceSpeed.value);
  utterance.volume = parseFloat(voiceVolume.value);
  speechSynthesis.speak(utterance);
}

function explainTerm() {
  const term = document.getElementById("explain-term").value.trim();
  if (!term) return;

  fetch("/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term })
  })
    .then((res) => res.json())
    .then((data) => {
      explanationText.textContent = data.explanation;
      speak(data.explanation);
    })
    .catch(() => {
      explanationText.textContent = "説明の取得に失敗しました。";
    });
}

function loadTemplates() {
  const category = document.getElementById("template-category").value;
  const templateDiv = document.getElementById("template-buttons");
  templateDiv.innerHTML = "";

  if (!category) return;

  fetch(`/templates?category=${category}`)
    .then((res) => res.json())
    .then((data) => {
      data.phrases.forEach((phrase) => {
        const button = document.createElement("button");
        button.textContent = phrase;
        button.onclick = () => {
          caregiverInput.value = phrase;
        };
        templateDiv.appendChild(button);
      });
    });
}

function downloadLog() {
  const logs = [...chatArea.children]
    .map((msg) => msg.textContent)
    .join("\n");

  const blob = new Blob([logs], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "chat_log.txt";
  link.click();
  URL.revokeObjectURL(url);
}
