from flask import Flask, request, jsonify, Response, render_template
from flask_cors import CORS
import os
import base64
import openai
from google.cloud import texttospeech
import json

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# Set up OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

# Load Google Cloud credentials from base64
google_credentials = os.getenv("GOOGLE_CREDENTIALS_JSON")
if google_credentials:
    service_account_info = json.loads(base64.b64decode(google_credentials))
    tts_client = texttospeech.TextToSpeechClient.from_service_account_info(service_account_info)
else:
    tts_client = texttospeech.TextToSpeechClient()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/ja/")
def ja():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        message = data.get("message", "")
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "あなたは介護の現場で使われる多言語対応AIです。"},
                {"role": "user", "content": message}
            ]
        )
        reply = response.choices[0].message["content"].strip()
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/tts", methods=["POST"])
def tts():
    data = request.get_json()
    text = data.get("text", "")
    lang = data.get("lang", "ja-JP")
    rate = float(data.get("rate", 1.0))  # speaking rate 追加

    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code=lang,
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=rate  # 再生速度の設定
    )

    response = tts_client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )

    return Response(response.audio_content, mimetype="audio/mpeg")

@app.route("/explain", methods=["POST"])
def explain():
    try:
        data = request.get_json()
        term = data.get("term", "")
        prompt_hint = data.get("prompt_hint", "高齢者にも分かりやすく説明してください。")
        prompt = f"{term} について {prompt_hint}"

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "あなたは高齢者にもわかりやすい言葉で専門用語をやさしく説明するAIです。"},
                {"role": "user", "content": prompt}
            ]
        )
        explanation = response.choices[0].message["content"].strip()
        return jsonify({"explanation": explanation})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
