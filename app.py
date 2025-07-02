from flask import Flask, request, jsonify, render_template
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
openai.api_key = os.getenv("OPENAI_API_KEY")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/ja/")
def index_ja():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")
    role = data.get("role", "介護士")

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": f"{role}として自然に会話してください"},
                {"role": "user", "content": message}
            ]
        )
        reply = response.choices[0].message["content"].strip()
        return jsonify({"response": reply})
    except Exception as e:
        return jsonify({"response": f"エラーが発生しました：{str(e)}"})

@app.route("/explain", methods=["POST"])
def explain():
    data = request.get_json()
    term = data.get("term", "")
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "日本語で30文字以内で簡潔に専門用語を説明してください。"},
                {"role": "user", "content": f"{term}とは？"}
            ]
        )
        explanation = response.choices[0].message["content"].strip()
        return jsonify({"explanation": explanation})
    except Exception as e:
        return jsonify({"explanation": f"取得に失敗しました：{str(e)}"})

@app.route("/templates")
def templates():
    return jsonify([
        {"category": "体調", "phrases": ["体調はどうですか？", "気になるところはありますか？"]},
        {"category": "薬", "phrases": ["薬は飲みましたか？", "飲み忘れはないですか？"]},
        {"category": "食事", "phrases": ["ごはんは食べましたか？", "食欲はありますか？"]},
        {"category": "睡眠", "phrases": ["昨晩はよく眠れましたか？", "睡眠に問題はありますか？"]}
    ])

@app.route("/save_log", methods=["POST"])
def save_log():
    data = request.get_json()
    print("保存されたログ:", data)
    return jsonify({"status": "保存しました"})

if __name__ == "__main__":
    app.run(debug=True)
