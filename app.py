from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

@app.route('/ja/chatbot/')
def chatbot_ja():
    return render_template('ja/chatbot.html')
