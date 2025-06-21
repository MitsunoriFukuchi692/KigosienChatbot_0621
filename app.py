import os
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import openai

# --- Configuration ---
openai.api_key = os.getenv('OPENAI_API_KEY')
app = Flask(__name__)
CORS(app)

# --- SQLite setup ---
DB_PATH = os.path.join(app.root_path, 'care_logs.db')
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cursor = conn.cursor()
cursor.execute(
    '''
    CREATE TABLE IF NOT EXISTS care_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        category TEXT,
        phrase TEXT
    )
    '''
)
conn.commit()

# --- Templates data (static) ---
TEMPLATES = [
    {"category": "体調", "phrases": ["今日の調子はいかがですか？", "痛みはありますか？"]},
    {"category": "服薬", "phrases": ["お薬はもう飲みましたか？", "飲み忘れはありませんか？"]},
    {"category": "排泄", "phrases": ["トイレに行きましょうか？", "お手伝いが必要ですか？"]}
]

@app.route('/templates', methods=['GET'])
def get_templates():
    return jsonify(TEMPLATES)

@app.route('/log', methods=['POST'])
def log_phrase():
    data = request.get_json(force=True)
    category = data.get('category')
    phrase = data.get('phrase')
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute(
        'INSERT INTO care_logs (timestamp, category, phrase) VALUES (?, ?, ?)',
        (timestamp, category, phrase)
    )
    conn.commit()
    return jsonify({'status': 'ok', 'timestamp': timestamp})

@app.route('/summary', methods=['GET'])
def generate_summary():
    # get today's logs
    rows = cursor.execute(
        "SELECT timestamp, category, phrase FROM care_logs WHERE date(timestamp)=date('now','localtime')"
    ).fetchall()
    text = "\n".join([f"[{r[1]}]{r[2]}" for r in rows])
    prompt = f"以下の介護ログを要約してください。\n{text}"
    resp = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[{'role':'user','content': prompt}],
        temperature=0.2
    )
    summary = resp.choices[0].message.content.strip()
    return jsonify({'summary': summary})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
