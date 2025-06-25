from flask import Flask, render_template, request, jsonify
app = Flask(__name__)

@app.route('/ja')
def chat_ja():
    return render_template('ja/chatbot.html')

@app.route('/en')
def chat_en():
    return render_template('en/chatbot.html')

@app.route('/chat', methods=['POST'])
def chat_api():
    data = request.get_json()
    user = data.get('text')
    # ここで OpenAI 等の処理
    reply = your_chat_function(user, data.get('lang'))
    return jsonify(reply=reply)

@app.route('/tts', methods=['POST'])
def tts_api():
    data = request.get_json()
    audio = your_tts_function(data.get('text'), data.get('lang'))
    return (audio, 200, {'Content-Type':'audio/mpeg'})

if __name__ == '__main__':
    app.run(debug=True)