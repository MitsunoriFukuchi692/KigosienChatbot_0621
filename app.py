from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ルート（/）と日本語チャット（/ja, /ja/）に対応

@app.route('/ping')
def ping():
    return "pong"

@app.route('/')
@app.route('/ja')
@app.route('/ja/')
def chat_ja():
    return render_template('ja/chatbot.html')

# 英語チャット（/en, /en/）に対応
@app.route('/en')
@app.route('/en/')
def chat_en():
    return render_template('en/chatbot.html')

@app.route('/chat', methods=['POST'])
def chat_api():
    data = request.get_json()
    reply = your_chat_function(data.get('text'), data.get('lang'))
    return jsonify(reply=reply)

@app.route('/tts', methods=['POST'])
def tts_api():
    data = request.get_json()
    audio = your_tts_function(data.get('text'), data.get('lang'))
    return (audio, 200, {'Content-Type':'audio/mpeg'})
