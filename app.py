from flask import Flask, jsonify, render_template, request, url_for, redirect
import os
import uuid
from openai import OpenAI
from google.cloud import texttospeech
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='static', template_folder='templates')

# OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Google TTS credentials from BASE64
import base64
import tempfile

base64_creds = os.getenv("GOOGLE_CREDENTIALS_JSON_BASE64")
if base64_creds:
    json_creds = base64.b64decode(base64_creds).decode("utf-8")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".json", mode="w") as f:
        f.write(json_creds)
        temp_path = f.name
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_path

# テンプレート（定型文）データ
template_data = [
    {"category": "体調", "phrases": ["今日の調子はいかがですか？", "痛みはありますか？"]},
    {"category": "服薬", "phrases": ["お薬はもう飲みましたか？", "飲み忘れはありませんか？"]}
]

@app.route('/')
def index():
    return redirect('/ja/chatbot/')

@app.route('/ja/chatbot/')
def chatbot_ja():
    return render_template('ja/chatbot.html')

@app.route('/templates')
def get_templates():
    return jsonify(template_data)

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    user_msg = data.get('message', '').strip()
    lang = data.get('lang', 'ja')

    system_prompts = {
        "ja": "あなたは高齢者と外国人介護士を支援する親切な会話ボットです。",
        "en": "You are a friendly support chatbot assisting elderly people and foreign caregivers.",
        "tl": "Ikaw ay isang magiliw na chatbot na tumutulong sa matatanda at mga banyagang tagapag-alaga.",
        "id": "Anda adalah chatbot ramah yang membantu lansia dan perawat asing.",
        "ms": "Anda ialah chatbot mesra yang membantu warga emas dan penjaga asing."
    }

    prompt = system_prompts.get(lang, system_prompts["ja"])

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_msg}
            ]
        )
        reply = response.choices[0].message.content.strip()
        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({'reply': f"エラーが発生しました: {e}"}), 500

@app.route('/tts', methods=['POST'])
def tts():
    data = request.get_json()
    text = data.get("text", "")
    lang = data.get("lang", "ja")

    lang_map = {
        "ja": "ja-JP",
        "en": "en-US",
        "tl": "fil-PH",
        "id": "id-ID",
        "ms": "ms-MY"
    }

    voice_lang = lang_map.get(lang, "ja-JP")

    try:
        tts_client = texttospeech.TextToSpeechClient()
        synthesis_input = texttospeech.SynthesisInput(text=text)
        voice = texttospeech.VoiceSelectionParams(
            language_code=voice_lang,
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        response = tts_client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        return response.audio_content, 200, {'Content-Type': 'audio/mp3'}
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
