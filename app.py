import os
from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
from openai import OpenAI
from datetime import datetime

# ★ static_url_path はデフォルト (/static) に戻す ★
app = Flask(__name__, static_folder="static")  
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ルート(/) と /ja/ の両方を同じページにマッピング
@app.route("/")
@app.route("/ja/")
def index():
    return render_template("index.html")

# 以下、/ja/ プレフィクスは不要なので --api-- 部分はそのまま
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    # ... (略) ...
    return jsonify({"response": ai_text})

@app.route("/explain", methods=["POST"])
def explain():
    # ... (略) ...
    return jsonify({"explanation": explanation})

@app.route("/templates", methods=["GET"])
def get_templates():
    # ... (略) ...
    return jsonify(templates)

@app.route("/save_log", methods=["POST"])
def save_log():
    # ... (略) ...
    return jsonify({"status": "success"})

if __name__ == "__main__":
    app.run(debug=True)
