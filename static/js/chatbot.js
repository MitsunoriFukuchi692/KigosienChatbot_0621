
let recognition;
const synth = window.speechSynthesis;

function startRecognition(sender) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'ja-JP';
  recognition.onresult = function(event) {
    const result = event.results[0][0].transcript;
    const inputId = sender === 'caregiver' ? 'caregiverInput' : 'careReceiverInput';
    document.getElementById(inputId).value = result;
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
  const input = document.getElementById(sender === 'caregiver' ? 'caregiverInput' : 'careReceiverInput');
  const message = input.value.trim();
  if (!message) return;

  const div = document.createElement('div');
  div.className = 'chat-message ' + sender;
  div.innerText = message;
  document.getElementById('chatLog').appendChild(div);
  input.value = '';
  speak(message);
}

function showSubTemplates(category) {
  const subTemplates = {
    '体調': ['体調はどうですか？', '気になる所はありますか？'],
    '薬': ['薬は飲みましたか？', '飲み忘れていませんか？'],
    '排泄': ['トイレに行きましたか？'],
    '食事': ['ご飯を食べましたか？'],
    '睡眠': ['昨夜は眠れましたか？']
  };
  const container = document.getElementById('subTemplates');
  container.innerHTML = '';
  subTemplates[category].forEach(text => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.onclick = () => {
      const div = document.createElement('div');
      div.className = 'chat-message caregiver';
      div.innerText = text;
      document.getElementById('chatLog').appendChild(div);
      speak(text);
    };
    container.appendChild(btn);
  });
}

function explainTerm() {
  const term = document.getElementById('termInput').value.trim();
  if (!term) return;
  fetch(`/explain?term=${encodeURIComponent(term)}`)
    .then(res => res.json())
    .then(data => {
      const explanation = data.explanation || `「${term}」の意味を調べています...`;
      const div = document.createElement('div');
      div.className = 'chat-message system';
      div.innerText = explanation;
      document.getElementById('chatLog').appendChild(div);
      speak(explanation);
    });
}
