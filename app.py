import os
import glob
from io import BytesIO
from flask import Flask, request, jsonify, render_template, send_file
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
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.route("/")
@app.route("/ja/")
def index():
    return render_template("index.html")

@app.route("/ja/templates", methods=["GET"])
def get_templates():
    return jsonify([
        # existing templates
    ])

@app.route("/ja/chat", methods=["POST"])
def chat():
    # ...
    pass

@app.route("/ja/explain", methods=["POST"])
def explain():
    # ...
    pass

@app.route("/ja/save_log", methods=["POST"])
def save_log():
    # ...
    pass

@app.route("/ja/daily_report", methods=["GET"])
def daily_report():
    log_files = sorted(glob.glob("logs/log_*.txt"))
    if not log_files:
        return jsonify({"error":"ログがありません"}), 404
    latest = log_files[-1]
    with open(latest, encoding="utf-8") as f:
        content = f.read()
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role":"system","content":"以下の対話ログをもとに、本日の介護日報を日本語で短くまとめてください。"},
            {"role":"user","content":content}
        ]
    )
    # 日付と時刻を追加
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    summary = f"日報作成日時: {now}
{response.choices[0].message.content.strip()}"
    buf = BytesIO(summary.encode("utf-8"))
    return send_file(buf, as_attachment=True, download_name="daily_report.txt", mimetype="text/plain")

if __name__ == "__main__":
    app.run(debug=True)
