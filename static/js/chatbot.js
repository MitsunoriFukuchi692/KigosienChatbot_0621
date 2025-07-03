// static/js/chatbot.js

// --- 音声認識設定 ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null;
if (SpeechRecognition) {
  recog = new SpeechRecognition();
  recog.lang = 'ja-JP';
  recog.interimResults = false;
}
let activeTarget = null;
function startRecognition(targetId) {
  if (!recog) { alert('音声認識に対応していません'); return; }
  activeTarget = document.getElementById(targetId);
  recog.start();
}
if (recog) {
  recog.addEventListener('result', e => {
    activeTarget.value = e.results[0][0].transcript;
  });
}

// --- メッセージ表示 ---
function appendMessage(sender, text) {
  const log = document.getElementById('chat-window');
  const div = document.createElement('div');
  div.className = sender==='介護士'? 'message-caregiver'
                : sender==='被介護者'? 'message-caree'
                : 'message-ai';
  div.textContent = `${sender}: ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// --- 送信（AI呼び出しなし） ---
function sendMessage(role) {
  const id = role==='caregiver'? 'caregiver-input' : 'caree-input';
  const label = role==='caregiver'? '介護士' : '被介護者';
  const txt = document.getElementById(id).value.trim();
  if (!txt) { alert('入力してください'); return; }
  appendMessage(label, txt);
  document.getElementById(id).value = '';
}

// --- テンプレート取得・表示（アラートで結果を通知） ---
async function loadTemplates(role) {
  const areaId = role === 'caregiver' ? 'caregiver-templates' : 'caree-templates';
  const container = document.getElementById(areaId);
  container.innerHTML = ''; // クリア

  const path = `/ja/templates/${role}`;
  alert(`テンプレート取得を開始します： ${path}`);  // ここでURLを通知

  let res;
  try {
    res = await fetch(path);
  } catch (e) {
    alert(`ネットワークエラーが発生しました： ${e}`);
    return;
  }
  if (!res.ok) {
    alert(`テンプレート取得失敗：ステータス${res.status}`);
    return;
  }
  let list;
  try {
    list = await res.json();
  } catch (e) {
    alert(`JSON解析エラー：${e}`);
    return;
  }
  alert(`取得したテンプレートカテゴリ数: ${list.length}`);

  // ボタンを作って画面に表示
  list.forEach(cat => {
    const btn = document.createElement('button');
    btn.textContent = cat.category;
    btn.addEventListener('click', () => {
      // サブテンプレート表示前に通知
      alert(`サブテンプレート表示：${cat.category}`);
      // 既存サブをクリア
      container.querySelectorAll('.sub-templates').forEach(e => e.remove());
      const sub = document.createElement('div');
      sub.className = 'sub-templates';
      cat.phrases.forEach(p => {
        const sb = document.createElement('button');
        sb.textContent = p;
        sb.addEventListener('click', () => {
          const targetId = role === 'caregiver' ? 'caregiver-input' : 'caree-input';
          document.getElementById(targetId).value = p;
          alert(`"${p}" を入力欄にセットしました`);
        });
        sub.appendChild(sb);
      });
      btn.insertAdjacentElement('afterend', sub);
    });
    container.appendChild(btn);
  });
}

// --- 用語説明 + 読み上げ ---
async function explainTerm() {
  const term = document.getElementById('term').value.trim();
  if (!term) { alert('用語を入力してください'); return; }
  alert(`用語説明リクエスト：${term}`);
  const res = await fetch('/ja/explain', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body: JSON.stringify({ term, maxLength:30 })
  });
  if (!res.ok) {
    alert(`用語説明失敗：ステータス${res.status}`);
    return;
  }
  const { explanation } = await res.json();
  alert(`説明結果：${explanation}`);
  document.getElementById('explanation').textContent = explanation;
  const u = new SpeechSynthesisUtterance(explanation);
  u.lang = 'ja-JP';
  u.rate = document.getElementById('rate-slider').value;
  u.volume = document.getElementById('volume-slider').value;
  speechSynthesis.speak(u);
}

// --- 初期化 ---
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('explain-btn').addEventListener('click', explainTerm);
});
