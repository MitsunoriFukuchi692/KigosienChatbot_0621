from flask import Flask, jsonify, render_template, request, redirect

app = Flask(__name__, static_folder='static', template_folder='templates')

# サンプルのテンプレートデータ
# 実際にはデータベースやファイルからロードしてください
template_data = [
    {
        "category": "体調",
        "phrases": [
            "今日の調子はいかがですか？",
            "痛みはありますか？"
        ]
    },
    {
        "category": "服薬",
        "phrases": [
            "お薬はもう飲みましたか？",
            "飲み忘れはありませんか？"
        ]
    }
]

@app.route('/templates')
def get_templates():
    return jsonify(template_data)

@app.route('/')
def index():
    # 語種切替などを実装したい場合に
    return redirect('/ja/chatbot/')

@app.route('/ja/chatbot/')
def chatbot_ja():
    return render_template('ja/chatbot.html')

if __name__ == '__main__':
    app.run(debug=True)
```

---

## templates/ja/chatbot.html

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>介護支援チャットボット</title>
  <link rel="stylesheet" href="/static/style.css">
</head>
<body>
  <header>
    <h1>介護支援チャットボット</h1>
  </header>

  <!-- テンプレート操作エリア -->
  <section id="template-section">
    <!-- カテゴリ一覧を表示する領域 -->
    <div id="template-categories"></div>
    <!-- フレーズ一覧を表示する領域 -->
    <div id="template-phrases"></div>
  </section>

  <!-- チャットUIエリア -->
  <section id="chat-container">
    <!-- 既存のチャット要素をここに配置 -->
  </section>

  <script>
  document.addEventListener('DOMContentLoaded', () => {
    const catDiv = document.getElementById('template-categories');
    const phraseDiv = document.getElementById('template-phrases');

    // /templates からカテゴリ・フレーズを取得
    fetch('/templates')
      .then(response => response.json())
      .then(data => {
        data.forEach(item => {
          const btn = document.createElement('button');
          btn.textContent = item.category;
          btn.addEventListener('click', () => {
            // フレーズ領域をクリア
            phraseDiv.innerHTML = '';
            // 該当カテゴリのフレーズをボタン化
            item.phrases.forEach(phrase => {
              const pBtn = document.createElement('button');
              pBtn.textContent = phrase;
              pBtn.addEventListener('click', () => {
                // チャット入力欄に挿入する処理例
                const input = document.querySelector('#chat-input');
                if (input) input.value = phrase;
              });
              phraseDiv.appendChild(pBtn);
            });
          });
          catDiv.appendChild(btn);
        });
      })
      .catch(err => console.error('テンプレート取得エラー:', err));
  });
  </script>
</body>
</html>
```
