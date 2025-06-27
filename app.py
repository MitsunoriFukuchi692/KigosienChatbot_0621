from flask import Flask, render_template, request, jsonify, redirect

app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static'
)

# キャッシュ無効化
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# ─── ここから追加 ────────────────────────────────
# ヘルスチェック用エンドポイント
@app.route('/ping')
def ping():
    return "pong"

# ルートと日本語／英語パスをすべて同じテンプレートへ
@app.route('/')
@app.route('/ja')
@app.route('/ja/')
@app.route('/en')
@app.route('/en/')
def chat():
    return render_template('chatbot.html')
# ─── ここまで追加 ────────────────────────────────

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
