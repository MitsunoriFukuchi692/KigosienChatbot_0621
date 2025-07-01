
function sendMessage() {
  const input = document.getElementById("user-input").value;
  const chat = document.getElementById("chat-window");
  const role = document.getElementById("speaker-role").value;
  const message = `${role}: ${input}`;
  const line = document.createElement("div");
  line.textContent = message;
  chat.appendChild(line);
  chat.scrollTop = chat.scrollHeight;
  messages.push({ role, input });
  document.getElementById("user-input").value = "";
}

function explainTerm() {
  const term = document.getElementById("explain-term").value;
  const chat = document.getElementById("chat-window");
  const response = `${term}: 簡単な説明を準備中です（仮）`;
  const line = document.createElement("div");
  line.textContent = response;
  chat.appendChild(line);
  chat.scrollTop = chat.scrollHeight;
}

function showSubOptions(category) {
  const sub = {
    "体調": ["体調はどうですか？", "気になる所はありますか？"],
    "薬": ["お薬は飲みましたか？", "飲み忘れていませんか？"],
    "排泄": ["排泄はどうでしたか？", "お手洗いには行きましたか？"],
    "食事": ["ご飯は食べましたか？", "好きな食べ物は？"],
    "睡眠": ["よく眠れましたか？", "昼寝はしましたか？"]
  };
  const subArea = document.getElementById("sub-options");
  subArea.innerHTML = "";
  sub[category].forEach(text => {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.onclick = () => {
      document.getElementById("user-input").value = text;
    };
    subArea.appendChild(btn);
  });
}

function startRecognition() {
  alert("音声認識は仮です（未実装）");
}

function saveToCSV() {
  let csv = "role,message\n";
  messages.forEach(msg => {
    csv += `${msg.role},${msg.input}\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "chat_log.csv";
  a.click();
}

let messages = [];
