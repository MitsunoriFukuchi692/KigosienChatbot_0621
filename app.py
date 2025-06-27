from flask import Flask, render_template, request, jsonify

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

# ヘルスチェック用
@app.route('/ping')
def ping():
    return "pong"

# チャット画面：日本語／英語とも同じテンプレートを返す
@app.route('/')
@app.route('/ja')
@app.route('/ja/')
@app.route('/en')
@app.route('/en/')
def chat():
    return render_template('chatbot.html')

# チャットAPI
@app.route('/chat', methods=['POST'])
def chat_api():
    data = request.get_json()
    # your_chat_function は実装済みの関数を呼び出してください
    reply = your_chat_function(data.get('text'), data.get('lang'))
    return jsonify(reply=reply)

# TTS API
@app.route('/tts', methods=['POST'])
def tts_api():
    data = request.get_json()
    # your_tts_function は実装済みの関数を呼び出してください
    audio = your_tts_function(data.get('text'), data.get('lang'))
    return (audio, 200, {'Content-Type': 'audio/mpeg'})

if __name__ == '__main__':
    # デバッグモードで起動すると開発用リロードが有効
    app.run(host='0.0.0.0', port=5000, debug=True)
