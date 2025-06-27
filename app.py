import os
from flask import Flask, render_template, request, jsonify, redirect

app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static'
)

# ─── キャッシュ無効化設定 ────────────────────────────
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
# ────────────────────────────────────────────────

# ヘルスチェック
@app.route('/ping')
def ping():
    return "pong"

# デバッグ：デプロイされたファイル一覧を返す
@app.route('/files')
def list_files():
    lines = []
    cwd = os.getcwd()
    for root, dirs, files in os.walk(cwd):
        rel_dir = os.path.relpath(root, cwd)
        lines.append(f"<b>/{rel_dir}</b>")
        for f in files:
            lines.append(f"&nbsp;&nbsp;{f}")
    html = "<br>".join(lines)
    return html, 200, {'Content-Type': 'text/html'}

# ルート／言語パスをすべて同じテンプレートに
@app.route('/')
@app.route('/ja')
@app.route('/ja/')
@app.route('/en')
@app.route('/en/')
def chat():
    return render_template('chatbot.html')

# チャット API
@app.route('/chat', methods=['POST'])
def chat_api():
    data = request.get_json()
    reply = your_chat_function(data.get('text'), data.get('lang'))
    return jsonify(reply=reply)

# TTS API
@app.route('/tts', methods=['POST'])
def tts_api():
    data = request.get_json()
    audio = your_tts_function(data.get('text'), data.get('lang'))
    return (audio, 200, {'Content-Type': 'audio/mpeg'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
