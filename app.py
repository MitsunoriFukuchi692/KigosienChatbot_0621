
from flask import Flask, render_template, request, jsonify
import os

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/ja/")
def ja():
    return render_template("index.html")

@app.route("/api/response", methods=["POST"])
def respond():
    data = request.get_json()
    user_message = data.get("message", "")
    return jsonify({"response": f"受け取ったメッセージ: {user_message}"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # ← RenderのPORTを使う
    app.run(host="0.0.0.0", port=port)