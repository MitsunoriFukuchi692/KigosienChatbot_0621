# app.py
```python
import os
from flask import Flask, request, jsonify, render_template, redirect, url_for
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

# 介護士用テンプレート
@app.route("/ja/templates/caregiver", methods=["GET"])
def get_caregiver_templates():
    return jsonify([
        {"category": "体調", "phrases": ["体調はいかがですか？", "痛みはありますか？"]},
        {"category": "薬",   "phrases": ["お薬は飲みましたか？", "飲み忘れはありませんか？"]}
    ])

# 被介護者用テンプレート
@app.route("/ja/templates/caree", methods=["GET"])
def get_caree_templates():
    return jsonify([
        {"category": "気分", "phrases": ["今日はどんな気分ですか？", "楽しいですか？"]},
        {"category": "食事", "phrases": ["何を食べましたか？", "おいしかったですか？"]}
    ])

@app.route("/ja/chat", methods=["POST"])
def chat():
    data = request.get_json()
    # ...同じ処理...

@app.route("/ja/explain", methods=["POST"])
def explain():
    # ...同じ処理...

@app.route("/ja/save_log", methods=["POST"])
def save_log():
    # ...同じ処理...

if __name__ == "__main__":
    app.run(debug=True)
```

# static/js/chatbot.js
```javascript
// --- 音声認識設定 ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = SpeechRecognition ? new SpeechRecognition() : null;
if (recog) { recog.lang = 'ja-JP'; recog.interimResults = false; }
let activeTarget = null;
function startRecognition(id) { if (!recog) return; activeTarget = document.getElementById(id); recog.start(); }
if (recog) recog.addEventListener('result', e => { activeTarget.value = e.results[0][0].transcript; });

function appendMessage(sender, text) {
  const log = document.getElementById('chat-window');
  const d = document.createElement('div');
  d.className = sender==='介護士'?'message-caregiver':sender==='被介護者'?'message-caree':'message-ai';
  d.textContent = `${sender}: ${text}`;
  log.appendChild(d); log.scrollTop = log.scrollHeight;
}

function sendMessage(role) {
  const id = role==='caregiver'?'caregiver-input':'caree-input';
  const label = role==='caregiver'?'介護士':'被介護者';
  const txt = document.getElementById(id).value.trim(); if(!txt)return;
  appendMessage(label, txt);
  document.getElementById(id).value='';
}

async function loadTemplates(role) {
  const path = `/ja/templates/${role}`;
  const res = await fetch(path);
  if (!res.ok) return;
  const list = await res.json();
  const area = document.getElementById(role+'-templates');
  area.innerHTML = '';
  list.forEach(cat => {
    const b = document.createElement('button');
    b.textContent = cat.category;
    b.addEventListener('click', ()=>{
      area.querySelectorAll('.sub-templates').forEach(e=>e.remove());
      const sub = document.createElement('div'); sub.className='sub-templates';
      cat.phrases.forEach(p => {
        const sb = document.createElement('button'); sb.textContent=p;
        sb.addEventListener('click', ()=> document.getElementById(
          role==='caregiver'?'caregiver-input':'caree-input'
        ).value = p);
        sub.appendChild(sb);
      });
      b.insertAdjacentElement('afterend', sub);
    });
    area.appendChild(b);
  });
}

async function explainTerm() {
  const term = document.getElementById('term').value.trim(); if(!term)return;
  const res = await fetch('/ja/explain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({term,maxLength:30})});
  const {explanation} = await res.json();
  document.getElementById('explanation').textContent=explanation;
  const u=new SpeechSynthesisUtterance(explanation);u.lang='ja-JP';u.volume=document.getElementById('volume-slider').value;u.rate=document.getElementById('rate-slider').value;speechSynthesis.speak(u);
}

window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('explain-btn').addEventListener('click', explainTerm);
});
