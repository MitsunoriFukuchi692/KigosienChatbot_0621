from flask import Flask, jsonify, render_template, request, redirect

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
    # とりあえずエコー返答
    reply = f"あなた: {user_msg}"
    return jsonify({'reply': reply})

if __name__ == '__main__':
    app.run(debug=True)