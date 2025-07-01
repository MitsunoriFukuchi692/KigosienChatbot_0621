
let recognition;
const synth = window.speechSynthesis;

function startRecognition() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'ja-JP';
  recognition.onresult = function(event) {
    const result = event.results[0][0].transcript;
    document.getElementById('caregiverInput').value = result;
  };
  recognition.start();
}

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'ja-JP';
  utterance.volume = parseFloat(document.getElementById('volumeControl').value);
  utterance.rate = parseFloat(document.getElementById('speedControl').value);
  synth.speak(utterance);
}

function sendMessage(sender) {
  const input = sender === 'caregiver' ? document.getElementById('caregiverInput') : document.getElementById('careReceiverInput');
  const message = input.value.trim();
  if (!message) return;

  const div = document.createElement('div');
  div.className = 'chat-message ' + sender;
  div.innerText = message;
  document.getElementById('chatLog').appendChild(div);
  input.value = '';
  speak(message);
}

function sendTemplate(category) {
  const templates = {
    '体調': '今日の体調はどうですか？',
    '薬': 'お薬はもう飲みましたか？',
    '排泄': 'トイレには行きましたか？',
    '食事': 'ご飯は食べましたか？',
    '睡眠': '昨夜はよく眠れましたか？'
  };
  const message = templates[category];
  const div = document.createElement('div');
  div.className = 'chat-message caregiver';
  div.innerText = message;
  document.getElementById('chatLog').appendChild(div);
  speak(message);
}

function explainTerm() {
  const term = document.getElementById('termInput').value.trim();
  if (!term) return;
  const explanation = `「${term}」の意味を調べています...`; // 仮
  const div = document.createElement('div');
  div.className = 'chat-message system';
  div.innerText = explanation;
  document.getElementById('chatLog').appendChild(div);
  speak(explanation);
}
