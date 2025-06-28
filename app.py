from flask import Flask, render_template, request, jsonify, redirect
import os
import traceback
import openai

# 環境変数からAPIキーを取得して設定
openai.api_key = os.getenv("OPENAI_API_KEY")

app = Flask(__name__,
            template_folder='templates',
            static_folder='static')
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.route('/ping')
def ping():
    return "pong"

# 入力支援用テンプレートを返すエンドポイント
@app.route('/templates')
def get_templates():
    data = [
      {"category":"薬",   "phrases":["お薬はお飲みになりましたか？","服用忘れはありませんか？"]},
      {"category":"体調", "phrases":["今日の調子はいかがですか？","違和感はありませんか？"]}
    ]
    return jsonify(data)

# チャット画面レンダリング
@app.route('/')
@app.route('/ja')
@app.route('/ja/')
@app.route('/en')
@app.route('/en/')
def chat():
    return render_template('chatbot.html')

# AIチャット用APIエンドポイント
@app.route('/chat', methods=['POST'])
def chat_api():
    data = request.get_json() or {}
    user_msg = data.get('message') or data.get('text', '')
    try:
        # OpenAI ChatCompletionを呼び出し
        resp = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": user_msg}]
        )
        bot_msg = resp.choices[0].message.content.strip()
        return jsonify(reply=bot_msg)
    except Exception as e:
        traceback.print_exc()
        return jsonify(error=str(e)), 500

# TTS用APIエンドポイント（実装済みと仮定）
@app.route('/tts', methods=['POST'])
def tts_api():
    # ここにTTS変換ロジックを実装
    return ('', 204)

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
    app.run(host='0.0.0.0', port=5000, debug=True)
