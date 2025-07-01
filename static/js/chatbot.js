
function setMessage(text) {
    document.getElementById("user-input").value = text;
    speakText(text);
}

function sendMessage() {
    const input = document.getElementById("user-input").value;
    if (!input) return;
    document.getElementById("chat-response").innerText = "送信中...";
    fetch("/chat", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({message: input})
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("chat-response").innerText = data.response;
        speakText(data.response);
    });
}

function explainTerm() {
    const input = document.getElementById("user-input").value;
    if (!input) return;
    fetch("/explain", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({term: input})
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("chat-response").innerText = data.explanation;
        speakText(data.explanation);
    });
}

function speakText(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    const volume = parseFloat(document.getElementById("volume").value);
    const rate = parseFloat(document.getElementById("rate").value);
    utterance.volume = volume;
    utterance.rate = rate;
    utterance.lang = "ja-JP";
    window.speechSynthesis.speak(utterance);
}
