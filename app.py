from flask import Flask, jsonify, render_template, request, redirect, url_for
import os
import uuid
from google.cloud import texttospeech

app = Flask(
    __name__,
    static_folder='static',
    template_folder='templates'
)

# サンプルのテンプレートデータ
template_data = [
    {"category": "体調", "phrases": ["今日の調子はいかがですか？", "痛みはありますか？"]},
    {"category": "服薬", "phrases": ["お薬はもう飲みましたか？", "飲み忘れはありませんか？"]}
]

@app.route('/templates')
def get_templates():
    return jsonify(template_data)

@app.route('/')
def index():
    return redirect('/ja/chatbot/')

@app.route('/ja/chatbot/')
def chatbot_ja():
    return render_template('ja/chatbot.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json() or {}
    user_msg = data.get('message', '').strip()
    reply = f"あなた: {user_msg}"
    return jsonify({'reply': reply})

@app.route('/api/chat', methods=['POST'])
def api_chat():
    data = request.get_json() or {}
    user_msg = data.get('message', '').strip()
    reply = f"あなた: {user_msg}"

    # --- TTS 合成 ---
    client = texttospeech.TextToSpeechClient()
    synthesis_input = texttospeech.SynthesisInput(text=reply)
    voice = texttospeech.VoiceSelectionParams(
        language_code="ja-JP",
        ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )
    tts_response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )

    # --- ファイル保存 ---
    audio_folder = os.path.join(app.static_folder, 'audio')
    os.makedirs(audio_folder, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.mp3"
    audio_path = os.path.join(audio_folder, filename)
    with open(audio_path, 'wb') as out_file:
        out_file.write(tts_response.audio_content)

    # --- url_for を使ってパスを組み立て ---
    audio_url = url_for('static', filename=f'audio/{filename}')

    return jsonify({
        'reply': reply,
        'audioUrl': audio_url
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)