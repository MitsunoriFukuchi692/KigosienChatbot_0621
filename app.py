from flask import Flask, request, jsonify
import openai

app = Flask(__name__)

# 環境変数などで設定済みと仮定
# openai.api_key = ...

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    role    = data.get('role', '').strip()

    # メッセージが空ならエラー返却
    if not message:
        return jsonify({ 'error': 'Empty message' }), 400

    # OpenAI Chat API に渡す messages を必ず 1 要素以上に
    messages = [ { 'role': role, 'content': message } ]

    try:
        resp = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        # レスポンスから本文を抽出
        reply = resp.choices[0].message.content
        return jsonify({ 'reply': reply })

    except openai.error.OpenAIError as e:
        # OpenAI エラーは 500 で返却
        return jsonify({ 'error': str(e) }), 500
    except Exception as e:
        # その他の例外も 500 で返却
        return jsonify({ 'error': str(e) }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
