// chat_interface.js

// This script handles speech recognition, template buttons, and chat interactions.
document.addEventListener("DOMContentLoaded", () => {
  // Chat container
  const chatContainer = document.getElementById("chat-container");

  // Template buttons container
  const templateContainer = document.getElementById("template-container");

  // Input elements
  const inputField = document.getElementById("user-input");
  const sendButton = document.getElementById("send-button");
  const micButton = document.getElementById("mic-button");

  // Load templates from server and render buttons
  console.log("▶️ Fetching templates...");
  fetch("/templates")
    .then(res => res.json())
    .then(templates => {
      console.log("★ templates loaded:", templates);
      templates.forEach(group => {
        group.phrases.forEach(phrase => {
          const btn = document.createElement("button");
          btn.className = "template-btn";
          btn.textContent = phrase;
          btn.addEventListener("click", () => {
            inputField.value = phrase;
            inputField.focus();
          });
          templateContainer.appendChild(btn);
        });
      });
    })
    .catch(err => console.error("❌ templates fetch error:", err));

  // Speech Recognition setup
  let recognition;
  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      micButton.classList.add('listening');
    };
    recognition.onend = () => {
      micButton.classList.remove('listening');
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputField.value = transcript;
      sendMessage();
    };
  } else {
    micButton.disabled = true;
    console.warn("Speech Recognition API not supported in this browser.");
  }

  // Toggle mic on/off
  micButton.addEventListener('click', () => {
    if (!recognition) return;
    recognition[recognition.recognizing ? 'stop' : 'start']();
  });

  // Send message on button click or Enter press
  sendButton.addEventListener('click', sendMessage);
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Send message function
  function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    appendMessage('user', text);
    inputField.value = '';

    // Typing indicator
    const loadingElem = document.createElement('div');
    loadingElem.className = 'message bot loading';
    loadingElem.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatContainer.appendChild(loadingElem);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    console.log("▶️ fetch -> /api/chat", text);
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    })
    .then(res => {
      console.log("◀️ status:", res.status);
      return res.json();
    })
    .then(data => {
      console.log('★ reply:', data.reply);
      chatContainer.removeChild(loadingElem);
      appendMessage('bot', data.reply);

      // If audioUrl is provided, render audio element with controls
      if (data.audioUrl) {
        const audioElem = document.createElement('audio');
        audioElem.src = data.audioUrl;
        audioElem.controls = true;
        audioElem.autoplay = true;
        chatContainer.appendChild(audioElem);
      }
    })
    .catch(err => {
      console.error('❌ fetch error:', err);
      chatContainer.removeChild(loadingElem);
      appendMessage('bot', '申し訳ありません。エラーが発生しました。');
    });
  }

  // Helper to append message element
  function appendMessage(role, text) {
    const elem = document.createElement('div');
    elem.className = `message ${role}`;
    elem.textContent = text;
    chatContainer.appendChild(elem);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
});
