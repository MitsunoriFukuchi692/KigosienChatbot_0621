from flask import Flask, jsonify, render_template, request, url_for, redirect
import os
import uuid
from openai import OpenAI
from google.cloud import texttospeech
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)  # static_folder や template_folder を変更していなければ、引数は不要です

# 日本語版チャット画面
@app.route('/ja')
def chat_ja():
    return render_template('ja/chatbot.html')

# 英語版チャット画面
@app.route('/en')
def chat_en():
    return render_template('en/chatbot.html')

# 例：チャットAPI のエンドポイント
@app.route('/chat', methods=['POST'])
def chat_api():
    data = request.get_json()
    user_text = data.get('text')
    lang = data.get('lang', 'ja')
    # ここで OpenAI API を呼んで response_reply を生成…
    response_reply = your_chat_function(user_text, lang)
    return jsonify(reply=response_reply)

# 例：TTS エンドポイント
@app.route('/tts', methods=['POST'])
def tts_api():
    data = request.get_json()
    text = data.get('text')
    lang = data.get('lang', 'ja')
    # ここで音声バイナリを生成して返す…
    audio_bytes = your_tts_function(text, lang)
    return (audio_bytes, 200, {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'inline; filename="speech.mp3"'
    })

if __name__ == '__main__':
    # 開発時はデバッグモードで起動
    app.run(host='0.0.0.0', port=5000, debug=True)