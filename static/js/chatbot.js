const chatArea = document.getElementById('chat-area');
const caregiverInput = document.getElementById('caregiverInput');
const patientInput = document.getElementById('patientInput');
const speakerSelect = document.getElementById('speakerSelect');
const volumeSlider = document.getElementById('volumeSlider');
const rateSlider = document.getElementById('rateSlider');
const slowMode = document.getElementById('slowMode');

function addMessage(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = `${sender}: ${text}`;
  chatArea.appendChild(messageDiv);
}

function sendMessage(role) {
  const input = role === 'caregiver' ? caregiverInput : patientInput;
  const text = input.value.trim();
  if (text === '') return;
  addMessage(role === 'caregiver' ? '👩‍⚕️' : '👴', text);
  input.value = '';
  speakText(text);
}

function sendTemplate(text) {
  const speaker = speakerSelect.value;
  addMessage(speaker === 'caregiver' ? '👩‍⚕️' : '👴', text);
  speakText(text);
}

function explainTerm() {
  const explanation = "喉の痛み、鼻水、くしゃみ、咳、倦怠感、頭痛などがあります。早めの対処が大切です。";
  addMessage('📘', explanation);
  speakText(explanation);
}

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = parseFloat(volumeSlider.value);
  utterance.rate = slowMode.checked ? 0.7 : parseFloat(rateSlider.value);
  speechSynthesis.speak(utterance);
}

function startMic() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'ja-JP';
  recognition.start();
  recognition.onresult = function (event) {
    const result = event.results[0][0].transcript;
    const input = speakerSelect.value === 'caregiver' ? caregiverInput : patientInput;
    input.value = result;
  };
}

function saveCSV() {
  const lines = Array.from(chatArea.children).map(div => div.textContent);
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'chatlog.csv';
  link.click();
}
