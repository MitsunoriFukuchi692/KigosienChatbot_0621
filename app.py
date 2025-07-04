import os
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from openai import OpenAI
from datetime import datetime

app = Flask(__name__, static_folder="static")
# キャッシュ無効化設定
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
CORS(app)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.after_request
def add_header(response):
    # HTMLテンプレートと静的ファイルのキャッシュを無効化
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

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
        },
        # ← ここから新規追加
        {
            "category": "薬",
            "caregiver": ["お薬は飲みましたか？", "飲み忘れはないですか？"],
            "caree":     ["飲みました。", "まだです。"]
        },
        {
            "category": "睡眠",
            "caregiver": ["昨夜はよく眠れましたか？", "何時にお休みになりましたか？"],
            "caree":     ["よく眠れました。", "少し寝不足です。"]
        },
        {
            "category": "排便",
            "caregiver": ["お通じはいかがですか？", "問題ありませんか？"],
            "caree":     ["問題ありません。", "少し便秘気味です。"]
        }
        # ← ここまで
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
