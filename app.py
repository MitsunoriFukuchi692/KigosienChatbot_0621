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
    message = data.get("message", "")
    messages = data.get("messages", [])
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "system", "content": "You are a helpful assistant."}]
                     + messages
                     + [{"role": "user", "content": message}]
        )
        return jsonify({"response": response.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/ja/explain", methods=["POST"])
def explain():
    data = request.get_json()
    term = data.get("term", "")
    try:
        messages = [
            {"role": "system", "content": "日本語で30文字以内で簡潔に専門用語を説明してください。"},
            {"role": "user",   "content": f"{term}とは？"}
        ]
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages
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
