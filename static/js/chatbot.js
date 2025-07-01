function sendTemplate(category) {
  const message = `template: [${category}] テンプレート発言です`;
  const chat = document.getElementById('chat-container');
  const p = document.createElement('p');
  p.textContent = message;
  chat.appendChild(p);
}

function explainTerm() {
  const term = document.getElementById("termInput").value;
  fetch(`/explain?term=${encodeURIComponent(term)}`)
    .then(response => response.text())
    .then(text => {
      const chat = document.getElementById("chat-container");
      const p = document.createElement("p");
      p.textContent = text;
      chat.appendChild(p);
      // ここにTTSなど音声読み上げを追加可能
    });
}
