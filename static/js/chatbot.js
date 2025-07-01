
function sendTemplate(text) {
    addMessage('👩‍⚕️', text);
}

function sendMessage(role) {
    const input = document.getElementById(role + 'Input');
    if (input.value.trim()) {
        addMessage(role === 'caregiver' ? '👩‍⚕️' : '👴', input.value.trim());
        input.value = '';
    }
}

function addMessage(sender, text) {
    const chatBox = document.getElementById('chat-box');
    const div = document.createElement('div');
    div.textContent = sender + ' ' + text;
    chatBox.appendChild(div);
}

function toggleTermInput() {
    const input = document.getElementById('termInput');
    const btn = document.getElementById('termExplainBtn');
    input.style.display = btn.style.display = 'inline-block';
}

function explainTerm() {
    const term = document.getElementById('termInput').value.trim();
    if (term) addMessage('📘', term + 'の説明を表示します（仮）');
}

function startVoice() { alert("マイク起動（仮）"); }
function saveChat() { alert("CSV保存（仮）"); }
