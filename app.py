from flask import Flask, jsonify, render_template, redirect

app = Flask(
    __name__,
    static_folder='static',
    template_folder='templates'
)

# サンプルのテンプレートデータ
template_data = [
    {
        "category": "体調",
        "phrases": ["今日の調子はいかがですか？", "痛みはありますか？"]
    },
    {
        "category": "服薬",
        "phrases": ["お薬はもう飲みましたか？", "飲み忘れはありませんか？"]
    }
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

if __name__ == '__main__':
    app.run(debug=True)
