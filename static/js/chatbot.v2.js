// ─── グローバルエラーキャッチャ ───
console.log('🚀 chatbot.v2.js loaded at ' + new Date().toISOString());

window.onerror = function(message, source, lineno, colno, error) {
console.log(`🛑 Error: ${message} at ${source}:${lineno}:${colno}`);
};

// --- 音声認識設定 ---
const SpeechRecognition = window\.SpeechRecognition || window\.webkitSpeechRecognition;
let recog = null;
if (SpeechRecognition) {
recog = new SpeechRecognition();
recog.lang = 'ja-JP';
recog.interimResults = false;
}
let activeTarget = null;
function startRecognition(targetId) {
if (!recog) return alert('音声認識に対応していません');
activeTarget = document.getElementById(targetId);
recog.start();
}
if (recog) {
recog.addEventListener('result', e => {
activeTarget.value = e.results\[0]\[0].transcript;
});
}

// --- TTS 呼び出し関数 ---
function speak(text, lang='ja-JP') {
console.log('▶︎ TTS speak:', text);
const ut = new SpeechSynthesisUtterance(text);
ut.lang   = lang;
ut.volume = parseFloat(document.getElementById('volume-slider')?.value) || 1.0;
ut.rate   = parseFloat(document.getElementById('rate-slider')?.value)   || 1.0;
ut.pitch  = 1.0;
window\.speechSynthesis.speak(ut);
}

// --- メッセージ表示 ---
function appendMessage(sender, text) {
const log = document.getElementById('chat-window');
const div = document.createElement('div');
div.className = sender==='介護士'
? 'message-caregiver'
: sender==='被介護者'
? 'message-caree'
: 'message-ai';
div.textContent = `${sender}: ${text}`;
log.appendChild(div);
log.scrollTop = log.scrollHeight;
}

// --- 送信 ---
function sendMessage(role) {
console.log('🔧 sendMessage called:', role);
const inputId = role==='caregiver' ? 'caregiver-input' : 'caree-input';
const label   = role==='caregiver' ? '介護士' : '被介護者';
const txt     = document.getElementById(inputId).value.trim();
console.log('🔧 message text:', txt);
if (!txt) return alert('入力してください');

appendMessage(label, txt);
speak(txt);
document.getElementById(inputId).value = '';
}

// --- テンプレート対話 ---
let currentTemplates = \[];
function startTemplateDialogue() {
console.log('🔧 startTemplateDialogue');
fetch('/ja/templates')
.then(r => r.ok ? r.json() : Promise.reject(r.status))
.then(list => {
currentTemplates = list;
const panel = document.getElementById('template-buttons');
panel.innerHTML = '';
list.forEach(item => {
const btn = document.createElement('button');
btn.textContent = item.category;
btn.addEventListener('click', () => showCaregiverPhrases(item));
panel.appendChild(btn);
});
})
.catch(e => alert(`テンプレート取得失敗: ${e}`));
}
function showCaregiverPhrases(item) {
console.log('🔧 showCaregiverPhrases:', item.category);
const panel = document.getElementById('template-buttons');
panel.innerHTML = '';
item.caregiver.forEach(text => {
const btn = document.createElement('button');
btn.textContent = text;
btn.addEventListener('click', () => {
appendMessage('介護士', text);
speak(text);
showCareePhrases(item);
});
panel.appendChild(btn);
});
}
function showCareePhrases(item) {
console.log('🔧 showCareePhrases:', item.category);
const panel = document.getElementById('template-buttons');
panel.innerHTML = '';
item.caree.forEach(text => {
const btn = document.createElement('button');
btn.textContent = text;
btn.addEventListener('click', () => {
appendMessage('被介護者', text);
speak(text);
startTemplateDialogue();
});
panel.appendChild(btn);
});
}

// --- 用語説明 + TTS ---
function explainTerm() {
const term = document.getElementById('term').value.trim();
if (!term) return alert('用語を入力してください');
fetch('/ja/explain', {
method:'POST',
headers:{'Content-Type':'application/json'},
body\:JSON.stringify({ term, maxLength:30 })
})
.then(r => r.ok ? r.json() : Promise.reject(r.status))
.then(({ explanation }) => {
document.getElementById('explanation').textContent = explanation;
speak(explanation);
})
.catch(e => alert(`用語説明失敗: ${e}`));
}

// --- 翻訳機能 + TTS ---
function translateExplanation() {
const orig = document.getElementById('explanation').textContent.trim();
if (!orig) return alert('まず用語説明を行ってください');
const dir = document.getElementById('translate-direction')?.value || 'ja-en';
fetch('/ja/translate', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ text: orig, direction: dir })
})
.then(r => r.ok ? r.json() : Promise.reject(r.status))
.then(({ translated }) => {
const resultEl = document.getElementById('translation-result');
resultEl.textContent = translated;
// 翻訳文も音声で再生
const lang = dir === 'ja-en' ? 'en-US' : 'ja-JP';
speak(translated, lang);
})
.catch(e => alert(`翻訳失敗: ${e}`));
}

// --- 会話ログ保存 ---
function saveLog() {
const lines = Array.from(document.querySelectorAll('#chat-window div'))
.map(div => div.textContent)
.join('\n');
return fetch('/ja/save\_log', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ username: '介護士', timestamp: new Date().toISOString(), input: lines, response: '' })
})
.then(res => res.json())
.then(json => {
if (json.status === 'success') {
alert('会話ログを保存しました');
return Promise.resolve();
} else {
return Promise.reject('保存失敗');
}
});
}

// --- 初期化 & 日報生成 ---
window\.addEventListener('DOMContentLoaded', () => {
document.getElementById('explain-btn').addEventListener('click', explainTerm);
document.getElementById('template-start-btn').addEventListener('click', startTemplateDialogue);
document.getElementById('save-log-btn').addEventListener('click', saveLog);
document.getElementById('daily-report-btn').addEventListener('click', () => {
saveLog()
.then(() => window\.location.href = '/ja/daily\_report')
.catch(() => alert('ログ保存失敗のため、日報生成できません'));
});
// 翻訳ボタンと選択肢のイベント
const transBtn = document.getElementById('translate-btn');
if (transBtn) transBtn.addEventListener('click', translateExplanation);
});
