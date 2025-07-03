# app.py
import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from openai import OpenAI
from datetime import datetime

app = Flask(__name__, static_folder="static")
CORS(app)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route("/")
@app.route("/ja/")
def index():
    return render_template("index.html")

# テンプレート（対話型ペア）API
@app.route("/ja/templates", methods=["GET"])
def get_templates():
    return jsonify([
        {
            "category": "体調",
            "caregiver": ["体調はいかがですか？", "痛みはありますか？"],
            "caree":     ["元気です。", "今日は少しだるいです。"]
        },
        {
            "category": "食事",
            "caregiver": ["お食事は何を召し上がりましたか？", "美味しかったですか？"],
            "caree":     ["サンドイッチを食べました。", "まだ食べていません。"]
        }
    ])

@app.route("/ja/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")
    messages = data.get("messages", [])
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role":"system","content":"You are a helpful assistant."}] + messages + [{"role":"user","content":message}]
        )
        return jsonify({"response": response.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/ja/explain", methods=["POST"])
def explain():
    data = request.get_json()
    term = data.get("term", "")
    try:
        msgs = [
            {"role": "system", "content": "日本語で30文字以内で簡潔に専門用語を説明してください。"},
            {"role": "user",   "content": f"{term}とは？"}
        ]
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=msgs
        )
        explanation = response.choices[0].message.content.strip()
        return jsonify({"explanation": explanation})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/ja/save_log", methods=["POST"])
def save_log():
    data = request.get_json()
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    now = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_path = os.path.join(log_dir, f"log_{now}.txt")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(f"ユーザー名: {data.get('username','')}\n")
        f.write(f"日時: {data.get('timestamp','')}\n")
        f.write(f"入力: {data.get('input','')}\n")
        f.write(f"返答: {data.get('response','')}\n")
    return jsonify({"status": "success"})

if __name__ == "__main__":
    app.run(debug=True)


# templates/index.html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>介護支援チャットボット</title>
  <link rel="stylesheet" href="{{ url_for('static', filename='css/styles.css') }}">
</head>
<body>
  <header><h1>AI介護支援ボット</h1></header>
  <main>
    <div id="chat-container"><div id="chat-window"></div></div>
    <div class="input-panel">
      <h3>介護士</h3>
      <input type="text" id="caregiver-input" placeholder="介護士の発言を入力">
      <button onclick="startRecognition('caregiver-input')">🎤</button>
      <button onclick="sendMessage('caregiver')">送信</button>

      <h3>被介護者</h3>
      <input type="text" id="caree-input" placeholder="被介護者の発言を入力">
      <button onclick="startRecognition('caree-input')">🎤</button>
      <button onclick="sendMessage('caree')">送信</button>
    </div>
    <button id="template-start-btn">テンプレート対話開始</button>
    <div id="template-buttons"></div>
    <div class="tts-panel">
      <label>音量:<input type="range" id="volume-slider" min="0" max="1" step="0.1" value="1"></label>
      <label>速度:<input type="range" id="rate-slider" min="0.5" max="2" step="0.1" value="1"></label>
    </div>
    <div id="glossary">
      <input type="text" id="term" placeholder="用語を入力">
      <button id="explain-btn">説明</button>
      <p id="explanation"></p>
    </div>
    <button id="save-log-btn">会話ログ保存</button>
  </main>
  <script src="{{ url_for('static', filename='js/chatbot.js') }}"></script>
</body>
</html>


# static/js/chatbot.js
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
  if (!recog) return alert('音声認識に対応していません');
  activeTarget = document.getElementById(targetId);
  recog.start();
}
if (recog) recog.addEventListener('result', e => { activeTarget.value = e.results[0][0].transcript; });

// --- メッセージ表示 ---
function appendMessage(sender, text) {
  const log = document.getElementById('chat-window');
  const div = document.createElement('div');
  div.className = sender==='介護士'? 'message-caregiver' : sender==='被介護者'? 'message-caree' : 'message-ai';
  div.textContent = `${sender}: ${text}`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

// --- 送信 ---
function sendMessage(role) {
  const id = role==='caregiver'? 'caregiver-input' : 'caree-input';
  const label = role==='caregiver'? '介護士' : '被介護者';
  const txt = document.getElementById(id).value.trim();
  if (!txt) return alert('入力してください');
  appendMessage(label, txt);
  document.getElementById(id).value = '';
}

// --- 対話型テンプレート ---
let currentTemplates = [];
function startTemplateDialogue() {
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
  const panel = document.getElementById('template-buttons');
  panel.innerHTML = '';
  item.caregiver.forEach(text => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      appendMessage('介護士', text);
      showCareePhrases(item);
    });
    panel.appendChild(btn);
  });
}
function showCareePhrases(item) {
  const panel = document.getElementById('template-buttons');
  panel.innerHTML = '';
  item.caree.forEach(text => {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      appendMessage('被介護者', text);
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
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ term, maxLength:30 })
  })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(({ explanation }) => {
      document.getElementById('explanation').textContent = explanation;
      const u = new SpeechSynthesisUtterance(explanation);
      u.lang='ja-JP';
      u.rate=document.getElementById('rate-slider').value;
      u.volume=document.getElementById('volume-slider').value;
      speechSynthesis.speak(u);
    })
    .catch(e => alert(`用語説明失敗: ${e}`));
}

// --- 初期化 ---
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('explain-btn').addEventListener('click', explainTerm);
  document.getElementById('template-start-btn').addEventListener('click', startTemplateDialogue);
});
