import os
import traceback
from flask import Flask, render_template, request, jsonify, redirect

app = Flask(
    __name__,
    template_folder='templates',
    static_folder='static'
)

# キャッシュ無効化設定
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.route('/ping')
def ping():
    return "pong"

@app.route('/files')
def list_files():
    lines = []
    cwd = os.getcwd()
    for root, dirs, files in os.walk(cwd):
        rel_dir = os.path.relpath(root, cwd)
        lines.append(f"<b>/{rel_dir}</b>")
        for f in files:
            lines.append(f"&nbsp;&nbsp;{f}")
    return "<br>".join(lines), 200, {'Content-Type': 'text/html'}

@app.route('/routes')
def list_routes():
    routes = []
    for rule in app.url_map.iter_rules():
        routes.append(f"{rule.rule} → {','.join(rule.methods)}")
    return "<br>".join(routes), 200, {'Content-Type': 'text/html'}

@app.route('/')
@app.route('/ja')
@app.route('/ja/')
@app.route('/en')
@app.route('/en/')
def chat():
    return render_template('chatbot.html')

@app.route('/chat', methods=['POST'])
def chat_api():
    data = request.get_json()
    try:
        # デバッグ用：リクエスト内容をログに出力
        app.logger.debug(f"[CHAT IN] text={data.get('text')} lang={data.get('lang')}")
        # --- TODO: ここに実際の your_chat_function の実装を入れる ---
        # とりあえず動作確認用のエコー
        reply = f"【テスト応答】「{data.get('text')}」を受け取りました。"
        return jsonify(reply=reply)
    except Exception as e:
        # スタックトレースをコンソール＆ログに出力
        traceback.print_exc()
        app.logger.error("Exception in /chat", exc_info=True)
        # エラー内容をクライアントにも返す
        return jsonify(error=str(e)), 500

@app.route('/tts', methods=['POST'])
def tts_api():
    data = request.get_json()
    try:
        # TODO: your_tts_function の実装をここに
        audio = b''  # ダミー
        return (audio, 200, {'Content-Type': 'audio/mpeg'})
    except Exception as e:
        traceback.print_exc()
        app.logger.error("Exception in /tts", exc_info=True)
        return jsonify(error=str(e)), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
