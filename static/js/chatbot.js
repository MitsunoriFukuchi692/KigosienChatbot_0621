
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const micButton = document.getElementById("mic-button");
const chatContainer = document.getElementById("chat-container");
const explainButton = document.getElementById("explain-button");
const termInput = document.getElementById("term-input");
const termExplanation = document.getElementById("term-explanation");
const phraseOptions = document.getElementById("phrase-options");

const volumeControl = document.getElementById("volume");
const rateControl = document.getElementById("rate");

const templates = {
  "体調": ["体調はどうですか？", "気になる所はありますか？"],
  "薬": ["薬は飲みましたか？", "飲み忘れはありませんか？"],
  "排便": ["今日は排便がありましたか？", "便の調子はどうですか？"],
  "睡眠": ["昨夜はよく眠れましたか？", "今朝は何時に起きましたか？"]
};

document.querySelectorAll(".category-button").forEach(button => {
  button.addEventListener("click", () => {
    const category = button.dataset.category;
    phraseOptions.innerHTML = "";
    templates[category].forEach(phrase => {
      const p = document.createElement("button");
      p.textContent = phrase;
      p.addEventListener("click", () => {
        userInput.value = phrase;
      });
      phraseOptions.appendChild(p);
    });
  });
});

sendButton.onclick = () => {
  const text = userInput.value;
  if (!text) return;
  appendMessage("👤", text);
  fetch("/chat", {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message: text})
  })
  .then(res => res.json())
  .then(data => {
    appendMessage("🤖", data.response);
    speakText(data.response);
  });
  userInput.value = "";
};

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = "message";
  msg.innerHTML = `<strong>${sender}</strong>: ${text}`;
  chatContainer.appendChild(msg);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

explainButton.onclick = () => {
  const term = termInput.value;
  if (!term) return;
  fetch("/explain", {
    method: "POST",
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({term})
  })
  .then(res => res.json())
  .then(data => {
    termExplanation.textContent = data.explanation;
    speakText(data.explanation);
  });
};

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = parseFloat(volumeControl.value);
  utterance.rate = parseFloat(rateControl.value);
  speechSynthesis.speak(utterance);
}
