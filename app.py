import os
import time
import traceback
from flask import Flask, render_template, request, jsonify, send_file, g
from openai import OpenAI
import io
from gtts import gTTS  # Google Text-to-Speech
import sqlite3

# 環境変数からAPIキーを取得して設定
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# SQLite データベース設定
DATABASE = os.path.join(os.getcwd(), 'chat_logs.db')

def get_db():
    if 'db' not in g:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        g.db = conn
    return g.db

@app.teardown_appcontext
def close_db(exc):
    db = g.pop('db', None)
    if db:
        db.close()

# Ping エンドポイント
@app.route('/ping')
def ping():
    return "pong"

# テンプレート取得用
@app.route('/templates')
def get_templates():
    data = [
        {"category": "薬",   "phrases": ["お薬はお飲みになりましたか？", "服用忘れはありませんか？"]},
        {"category": "体調", "phrases": ["今日の調子はいかがですか？", "違和感はありませんか？"]}
    ]
    return jsonify(data)

# チャット画面レンダリング
@app.route('/')
@app.route('/ja')
@app.route('/ja/')
@app.route('/en')
@app.route('/en/')
def chat_page():
    return render_template('chatbot.html')

# AIチャット用APIエンドポイント
@app.route('/chat', methods=['POST'])
def chat_api():
    data = request.get_json() or {}
    user_msg = data.get('message') or data.get('text', '')
    try:
        resp = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": user_msg}]
        )
        bot_msg = resp.choices[0].message.content.strip()
        # 会話ログをDBに記録
        db = get_db()
        db.execute('INSERT INTO logs (role, message, timestamp) VALUES (?, ?, ?)',
                   ('user', user_msg, int(time.time())))
        db.execute('INSERT INTO logs (role, message, timestamp) VALUES (?, ?, ?)',
                   ('bot', bot_msg, int(time.time())))
        db.commit()
        return jsonify(reply=bot_msg)
    except Exception as e:
        traceback.print_exc()
        return jsonify(error=str(e)), 500

# TTS用APIエンドポイント (gTTS使用)
@app.route('/tts', methods=['POST'])
def tts_api():
    data = request.get_json() or {}
    text = data.get('text', '')
    lang = data.get('lang', 'ja')
    try:
        # gTTS で MP3 を生成
        tts = gTTS(text=text, lang=lang)
        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)

        # クライアントに MP3 を返す
        return send_file(
            buf,
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='tts.mp3'
        )
    except Exception as e:
        traceback.print_exc()
        return jsonify(error=str(e)), 500

# 対話ログをJSONで取得するエンドポイント
@app.route('/logs')
def show_logs():
    db = get_db()
    rows = db.execute('SELECT * FROM logs ORDER BY timestamp').fetchall()
    return jsonify([dict(r) for r in rows])

# 登録ルート一覧表示
@app.route('/routes')
def list_routes():
    routes = [f"{r.rule} → {','.join(r.methods)}" for r in app.url_map.iter_rules()]
    return "<br>".join(routes), 200, {'Content-Type': 'text/html'}

# プロジェクト内ファイル一覧表示
@app.route('/files')
def list_files():
    lines = []
    cwd = os.getcwd()
    for root, dirs, files in os.walk(cwd):
        rel = os.path.relpath(root, cwd)
        lines.append(f"<b>/{rel}</b>")
        for f in files:
            lines.append(f"&nbsp;&nbsp;{f}")
    return "<br>".join(lines), 200, {'Content-Type': 'text/html'}

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)), debug=True)
