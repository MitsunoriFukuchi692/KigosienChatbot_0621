const chatWindow = document.getElementById("chat-window");
const rateControl = document.getElementById("rateControl");
const volumeControl = document.getElementById("volumeControl");

function appendMessage(role, message) {
  const div = document.createElement("div");
  div.className = role === "caregiver" ? "message caregiver" : "message patient";
  div.textContent = `${role === "caregiver" ? "介護士" : "被介護者"}：${message}`;
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function sendMessage(role) {
  const input = document.getElementById(`${role}-input`);
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
      appendMessage("assistant", data.reply);
      speak(data.reply);
    });
}

function startRecognition(role) {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = "ja-JP";
  recognition.onresult = (event) => {
    document.getElementById(`${role}-input`).value = event.results[0][0].transcript;
  };
  recognition.start();
}

function speak(text) {
  fetch("/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      rate: parseFloat(rateControl.value),
      volume: parseFloat(volumeControl.value)
    }),
  });
}

function explainTerm() {
  const term = document.getElementById("explain-word").value;
  if (!term) return;
  fetch("/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ term })
  })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("explanation-result").textContent = data.explanation;
      speak(data.explanation);
    });
}

function selectTemplate(category) {
  const sub = {
    "体調": ["体調はどうですか？", "痛みはありますか？"],
    "薬": ["お薬は飲みましたか？", "薬に副作用はありましたか？"],
    "排便": ["今日うんちは出ましたか？", "便の様子はどうでしたか？"],
    "睡眠": ["昨夜はよく眠れましたか？", "途中で起きましたか？"],
    "食事": ["食事は全部食べましたか？", "味はどうでしたか？"]
  };
  const subButtons = sub[category].map(q => `<button onclick="insertToInput('caregiver', '${q}')">${q}</button>`).join("");
  document.getElementById("sub-template-buttons").innerHTML = subButtons;
}

function insertToInput(role, text) {
  document.getElementById(`${role}-input`).value = text;
}
