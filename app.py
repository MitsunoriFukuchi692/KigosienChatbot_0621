from flask import Flask, render_template, request, jsonify, send_file
import os
import traceback
from openai import OpenAI

import io   # ← 追加
# from your_tts_module import synthesize_mp3  ← 実際のTTS関数をインポート

# 環境変数からAPIキーを取得して設定
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = Flask(__name__, template_folder='templates', static_folder='static')
# （省略）…

@app.route('/tts', methods=['POST'])
def tts_api():
    data = request.get_json() or {}
    text = data.get('text', '')
    lang = data.get('lang', 'ja')

    try:
        # ここで実際に音声データ（mp3バイト列）を生成する
        audio_bytes = synthesize_mp3(text, lang=lang)  

        # バイト列を直接返す
        return send_file(
            io.BytesIO(audio_bytes),
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='tts.mp3'
        )
    except Exception as e:
        traceback.print_exc()
        # エラー時は204ではなく500とメッセージ返却
        return jsonify(error=str(e)), 500
