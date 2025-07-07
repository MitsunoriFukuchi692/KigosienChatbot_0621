document.addEventListener("DOMContentLoaded", () => {
  console.log('🚀 chatbot.v3.js loaded at ' + new Date().toISOString());

  // ─── グローバルエラーキャッチャ ───
  window.onerror = function(message, source, lineno, colno, error) {
    console.log(`🛑 Error: ${message} at ${source}:${lineno}:${colno}`);
  };

  // --- 音声認識設定 ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recog = null;
  let activeTarget = null;

  if (SpeechRecognition) {
    recog = new SpeechRecognition();
    recog.lang = 'ja-JP';
    recog.interimResults = false;
    recog.onstart = () => console.log('🔴 認識開始');
    recog.onend   = () => console.log('⚪ 認識終了');
    recog.onerror = e => console.error('SpeechRec Error:', e);
    recog.addEventListener('result', e => {
      if (activeTarget) activeTarget.value = e.results[0][0].transcript;
    });
  }

  // グローバル関数として登録
  window.startRecognition = function(targetId) {
    if (!recog) {
      alert('▶ 音声認識に対応していません');
      return;
    }
    activeTarget = document.getElementById(targetId);
    if (!activeTarget) {
      console.error('対象要素が見つかりません:', targetId);
      return;
    }
    recog.start();
  };

  // --- TTS 関数 ---
  function speak(text, lang='ja-JP') {
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang   = lang;
    ut.volume = parseFloat(document.getElementById('volume-slider')?.value) || 1.0;
    ut.rate   = parseFloat(document.getElementById('rate-slider')?.value)   || 1.0;
    ut.pitch  = 1.0;
    window.speechSynthesis.speak(ut);
  }

  // --- メッセージ表示 ---
  function appendMessage(sender, text) {
    const log = document.getElementById('chat-window');
    const div = document.createElement('div');
    div.className = sender==='介護士'
      ? 'message-caregiver'
      : sender==='被介護者'
      ? 'message-caree'
      : 'message-ai';
    div.textContent = `${sender}: ${text}`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  // --- 送信 ---
  window.sendMessage = function(role) {
    const inputId = role==='caregiver' ? 'caregiver-input' : 'caree-input';
    const label   = role==='caregiver' ? '介護士' : '被介護者';
    const txt     = document.getElementById(inputId).value.trim();
    if (!txt) return alert('入力してください');
    appendMessage(label, txt);
    speak(txt);
    document.getElementById(inputId).value = '';
  };

  // --- テンプレート対話 ---
  let currentTemplates = [];
  document.getElementById('template-start-btn').addEventListener('click', () => {
    fetch('/ja/templates')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(list => {
        currentTemplates = list;
        const panel = document.getElementById('template-buttons');
        panel.innerHTML = '';
        list.forEach(item => {
          const btn = document.createElement('button');
          btn.textContent = item.category;
          btn.addEventListener('click', () => showCaregiverPhrases(item));
          panel.appendChild(btn);
        });
      })
      .catch(e => alert(`テンプレート取得失敗: ${e}`));
  });
  function showCaregiverPhrases(item) {
    const panel = document.getElementById('template-buttons');
    panel.innerHTML = '';
    item.caregiver.forEach(text => {
      const btn = document.createElement('button'); btn.textContent = text;
      btn.addEventListener('click', () => {
        appendMessage('介護士', text); speak(text);
        showCareePhrases(item);
      }); panel.appendChild(btn);
    });
  }
  function showCareePhrases(item) {
    const panel = document.getElementById('template-buttons');
    panel.innerHTML = '';
    item.caree.forEach(text => {
      const btn = document.createElement('button'); btn.textContent = text;
      btn.addEventListener('click', () => {
        appendMessage('被介護者', text); speak(text);
        document.getElementById('template-buttons').innerHTML = '';
      }); panel.appendChild(btn);
    });
  }

  // --- 用語説明 ---
  document.getElementById('explain-btn').addEventListener('click', () => {
    const term = document.getElementById('term').value.trim();
    if (!term) return alert('用語を入力してください');
    fetch('/ja/explain', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ term, maxLength:30 }) })
      .then(r => r.ok? r.json(): Promise.reject(r.status))
      .then(({explanation}) => { document.getElementById('explanation').textContent = explanation; speak(explanation); })
      .catch(e => alert(`用語説明失敗: ${e}`));
  });

  // --- 翻訳 ---
  document.getElementById('translate-btn').addEventListener('click', () => {
    const orig = document.getElementById('explanation').textContent.trim();
    if (!orig) return alert('まず用語説明を行ってください');
    const dir = document.getElementById('translate-direction').value;
    fetch('/ja/translate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ text: orig, direction: dir }) })
      .then(r=>r.ok?r.json():Promise.reject(r.status))
      .then(({translated}) => { document.getElementById('translation-result').textContent = translated; speak(translated, dir==='ja-en'?'en-US':'ja-JP'); })
      .catch(e => alert(`翻訳失敗: ${e}`));
  });

  // --- ログ保存 & 日報生成 ---
  document.getElementById('save-log-btn').addEventListener('click', () => {
    const lines = Array.from(document.querySelectorAll('#chat-window div')).map(div=>div.textContent).join('\n');
    fetch('/ja/save_log', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username:'介護士', timestamp:new Date().toISOString(), input:lines, response:'' }) })
      .then(r=>r.json())
      .then(j=> j.status==='success'? alert('会話ログを保存しました') : Promise.reject('保存失敗'))
      .catch(()=> alert('会話ログ保存に失敗しました'));
  });
  document.getElementById('daily-report-btn').addEventListener('click', () => {
    document.getElementById('save-log-btn').click();
    setTimeout(() => location.href='/ja/daily_report', 500);
  });
});