'use strict';

(() => {
  const {stages, rows, blends, typing, paper, signs} = LandLessons;
  const app = document.querySelector('#main');
  const announce = document.querySelector('#announce');
  const soundButton = document.querySelector('#sound');
  const storageKey = 'romaji-land-progress-v1';
  let saved;
  try { saved = JSON.parse(localStorage.getItem(storageKey)); } catch {}
  const progress = {
    items: saved?.items && typeof saved.items === 'object' ? saved.items : {},
    stops: saved?.stops && typeof saved.stops === 'object' ? saved.stops : {},
    last: stages.some(stage => stage.id === saved?.last) ? saved.last : 'combine',
    sound: saved?.sound !== false,
    fingerGuide: saved?.fingerGuide !== false
  };
  let storageAvailable = save();
  let run;
  let route;
  let lessonView;
  let tableKind = 0;
  let paperStageId = 'combine';
  let imeIndex = 0;
  let imeValue = '';
  let imeHelp = false;
  let imeDone = false;
  let imeHome = false;
  let keyboardResize;
  let noticeId = 0;

  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const latin = text => '<span lang="en" class="latin">' + escape(text) + '</span>';
  const today = () => {
    const now = new Date();
    return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  };
  const itemKey = (stage, index) => stage.id + '/' + index;
  const stageFor = id => stages.find(stage => stage.id === id);
  const bank = stages.flatMap(stage => stage.items.map((question, index) => ({stage, index, question})));
  const available = () => bank.filter(({stage,index}) => progress.items[itemKey(stage,index)]?.due <= today());
  const seenIn = stage => stage.items.filter((_, index) => progress.items[itemKey(stage,index)]).length;

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
      return true;
    } catch { return false; }
  }

  function note(text) {
    announce.textContent = '';
    const current = ++noticeId;
    requestAnimationFrame(() => {
      if (current === noticeId) announce.textContent = text;
    });
  }

  function syncSound() {
    soundButton.textContent = progress.sound ? '音あり' : '音なし';
    soundButton.setAttribute('aria-pressed', String(progress.sound));
  }

  function speak(text) {
    if (!progress.sound) {
      note('音なしに設定されています。上の「音なし」で音を入れられます。');
      return;
    }
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      note('この端末では読み上げを使えません。');
      return;
    }
    try {
      speechSynthesis.cancel();
      const reading = new SpeechSynthesisUtterance(text);
      reading.lang = 'ja-JP';
      reading.rate = 0.85;
      const voice = speechSynthesis.getVoices().find(candidate => candidate.lang.toLowerCase().startsWith('ja'));
      if (voice) reading.voice = voice;
      reading.onerror = event => {
        if (!['interrupted','canceled'].includes(event.error)) note('読み上げができませんでした。文字を見て進めます。');
      };
      speechSynthesis.speak(reading);
    } catch { note('読み上げができませんでした。文字を見て進めます。'); }
  }

  function action(name, label, classes = '', data = '') {
    return '<button type="button" data-action="' + name + '" ' + data + ' class="' + classes + '">' + label + '</button>';
  }

  function listen(text, label = '音をきく') {
    return action('speak', '♪ ' + label, 'quiet', 'data-text="' + escape(text) + '"');
  }

  function title(kicker, heading, text) {
    return '<header class="page-title"><p class="kicker">' + kicker + '</p><h1>' + heading + '</h1><p>' + text + '</p></header>';
  }

  function tiles(parts, opts = {}) {
    const marked = Array.isArray(opts.marked) ? opts.marked : [opts.marked];
    const label = opts.hidden ? '見本はかくれています' : parts.map((part,index) => opts.blank === index ? '空らん' : part.trim()).join('、');
    return '<div class="tiles" role="group" aria-label="' + escape(label) + '">' +
      parts.map((part,index) => {
        const blank = opts.hidden || opts.blank === index;
        return '<span class="tile' + (marked.includes(index) ? ' marked' : '') + (blank ? ' blank' : '') + (part.endsWith(' ') ? ' word-end' : '') + '" aria-hidden="true">' + (blank ? '？' : escape(part.trim())) + '</span>';
      }).join('') + '</div>';
  }

  function showMap() {
    const next = stageFor(progress.last);
    const due = available().length;
    const started = Object.keys(progress.stops).length + Object.keys(progress.items).length > 0;
    app.innerHTML = '<section class="hero"><div class="hero-copy"><p class="kicker">ことばの しまへ ようこそ</p><h1><span>ローマ字で</span> <span>しまを めぐろう</span></h1><p>文字をかえて、読んで、しまのふだをとどけよう。</p><a class="primary" href="#lesson/' + next.id + '">' + (started ? 'つづきへ' : 'はじめる') + ' <span aria-hidden="true">→</span></a>' +
      (!started ? '<a class="hero-secondary" href="#lesson/vowels">a・i・u・e・o から</a>' : '') +
      '</div><div class="hero-art" aria-hidden="true"></div></section>' +
      (due ? '<a class="review-banner" href="#review"><span>きょうの ふくしゅう</span><strong>' + due + ' 問 →</strong></a>' : '') +
      '<div class="section-heading"><h2>しまの 地図</h2><p>見たいところから えらべるよ。</p></div><ul class="map-grid">' +
      stages.map((stage, i) => '<li><a class="map-stop tone-' + i%3 + '" href="#lesson/' + stage.id + '"><span class="stop-icon" aria-hidden="true">' + stage.icon + '</span><span><span class="stop-place">' + stage.place + '</span><strong>' + stage.title + '</strong><span class="stop-sub">' + stage.subtitle + '</span>' + (progress.stops[stage.id] ? '<span class="stop-done">✓ ふだをとどけた</span>' : '') + '</span><span class="arrow" aria-hidden="true">→</span></a></li>').join('') + '</ul>';
  }

  function showLesson(stage, teacher = false) {
    const current = stage.demo[lessonView.index];
    const before = lessonView.index ? stage.demo[lessonView.index-1] : null;
    const focus = lessonView.revealed;
    const sample = entry => '<div class="sample"><strong>' + escape(entry.kana) + '</strong>' +
      tiles(entry.parts,{marked:focus ? entry.at : undefined,hidden:!focus}) +
      listen(entry.sound || entry.kana) + '</div>';
    const next = stages[stages.indexOf(stage)+1];
    app.innerHTML = '<a class="back" href="' + (teacher ? '#teacher' : '#map') + '">← ' + (teacher ? '先生のメニュー' : 'しまの地図') + '</a>' +
      title(stage.icon + ' ' + stage.place, stage.title, teacher && !focus ? '音を聞いて、つづりを予想しよう。' : stage.instruction) +
      '<section class="board demo"><div class="bar"><h2>' + (teacher ? 'ならべて実演' : '見て くらべよう') + '</h2><span>' + (lessonView.index+1) + ' / ' + stage.demo.length + '</span></div>' +
      '<div class="comparison' + (before ? '' : ' single') + '">' + (before ? sample(before) : '') + sample(current) + '</div>' +
      '<p class="focus-line">' + (focus ? '<strong>見るところ</strong> ' + stage.spotlight : '文字を予想してから、見本をひらこう。') + '</p>' +
      (['vowels','combine','rows'].includes(stage.id) ? '<div class="demo-choices" aria-label="くらべたい音">' + stage.demo.map((entry,index) =>
        action('demo-pick',escape(entry.kana),'quiet','data-index="' + index + '" aria-pressed="' + (lessonView.index===index) + '"')).join('') + '</div>' : '') +
      '<div class="controls wrap">' + action('demo-prev','← まえ','quiet',lessonView.index===0 ? 'disabled' : '') +
      action('demo-next','つぎの見本 →','quiet',lessonView.index===stage.demo.length-1 ? 'disabled' : '') +
      action('demo-toggle', focus ? '文字をかくす' : '見本を見る','quiet','aria-pressed="' + String(!focus) + '"') + '</div></section>' +
      '<section class="board tip"><h2>ことばにしよう</h2><p>' + (focus ? stage.say : '同じところ、かわるところを 指でさしてみよう。') + '</p>' +
      (focus ? listen(stage.say,'コツをきく') : '') + '</section>' +
      (teacher ? '<p class="subnote">見本をかくして、予想や指さしを待てます。同じ見本の音を何度でも聞けます。</p>' : '<div class="actions"><button type="button" class="primary" data-action="start">やってみる <span aria-hidden="true">→</span></button><a class="quiet" href="#paper/' + stage.id + '">紙に書く</a><a class="quiet" href="#table">表をひらく</a>' + (next && seenIn(stage) ? '<a class="quiet" href="#lesson/' + next.id + '">つぎの場所へ</a>' : '') + '</div>');
  }

  function shuffle(values) {
    const result = [...values];
    for (let i=result.length-1;i>0;i--) {
      const j = Math.floor(Math.random()*(i+1));
      [result[i],result[j]] = [result[j],result[i]];
    }
    return result;
  }

  function startSession(stage, review = false) {
    let queue;
    if (review) {
      queue = available().sort((a,b) => progress.items[itemKey(a.stage,a.index)].due - progress.items[itemKey(b.stage,b.index)].due).slice(0,3);
      const first = queue[0];
      const transfer = first && bank.find(entry => entry.stage === first.stage && entry.question.kana !== first.question.kana &&
        entry.question.type === first.question.type && !progress.items[itemKey(entry.stage,entry.index)]);
      if (transfer) queue.push(transfer);
    } else {
      const pending = stage.items.map((question,index) => ({stage,index,question})).sort((a,b) => {
        const priority = entry => {
          const record = progress.items[itemKey(entry.stage,entry.index)];
          return !record ? 0 : record.due <= today() ? -1 : record.level+1;
        };
        return priority(a)-priority(b);
      });
      const types = new Set();
      const mixed = pending.filter(entry => {
        if (types.has(entry.question.type)) return false;
        types.add(entry.question.type);
        return true;
      });
      queue = [...mixed,...pending.filter(entry => !mixed.includes(entry))].slice(0,3);
      if (!progress.stops[stage.id]) queue.push({stage, index:null, question:stage.rule});
    }
    if (!queue.length) return;
    run = {queue, stage, review, index:0, independent:0, assisted:0};
    beginQuestion();
  }

  const currentEntry = () => run.queue[run.index];
  const currentQuestion = () => currentEntry().question;

  function beginQuestion() {
    const question = currentQuestion();
    run.turn = {
      hints:0, mistakes:0, done:false, mode:'pieces', value:'', checked:'', message:'',
      choices:shuffle(question.choices || question.letters)
    };
    showPractice();
    app.querySelector('#question-title').focus();
  }

  function practiceHeading(question) {
    if (question.type === 'rule') return question.prompt;
    if (question.type === 'read') return 'ローマ字を 読もう';
    if (question.type === 'build') return '文字を ならべよう';
    return '空らんに 入るのは？';
  }

  function expectedValue(question) {
    if (question.type === 'read') return question.kana;
    if (question.type === 'gap') return question.parts[question.at];
    if (question.type === 'build') return run.turn.mode === 'full' ? question.chunks.join('') : question.chunks[question.at];
    return question.choices[0];
  }

  function showPractice(focusSelector) {
    const {stage, question} = currentEntry();
    const turn = run.turn;
    const alt = question.type === 'build' && turn.mode === 'full';
    const actual = expectedValue(question);
    const model = question.parts?.join('') || question.spelling || question.chunks?.join('') || question.choices[0];
    let task = '';
    if (question.type === 'read') {
      task = '<div class="read-word">' + latin(question.spelling) + '</div>';
    } else if (question.kana) {
      task = '<div class="problem-kana"><strong>' + escape(question.kana) + '</strong>' + listen(question.sound || question.kana) + '</div>';
      if (question.type === 'gap') task += tiles(question.parts,{blank:turn.done ? undefined : question.at,marked:question.at});
      if (question.type === 'build' && !alt) {
        const chunks = [...question.chunks];
        if (!turn.done) chunks[question.at] = turn.value.padEnd(actual.length,'＿');
        task += tiles(chunks,{marked:question.at}) + '<p class="subnote">わくの場所だけ、文字を ならべよう。</p>';
      }
    }
    let answer = '';
    if (!turn.done && question.type === 'build' && alt) {
      answer = '<form id="full-form" class="controls full-form"><label for="full-answer">ローマ字で ぜんぶ書く</label><input id="full-answer" name="answer" value="' + escape(turn.value) + '" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="40"><button class="primary" type="submit">たしかめる</button></form>';
      const symbols = stage.id === 'n' ? ['’'] : stage.id === 'long' ? ['ā','ī','ū','ē','ō'] : [];
      if (symbols.length) {
        answer += '<div class="choices symbols" aria-label="記号や長音の文字を入れる">' + symbols.map(symbol =>
          action('insert-symbol',latin(symbol),'quiet','data-symbol="' + escape(symbol) + '"' +
            (symbol==='’' ? ' aria-label="アポストロフィを入れる"' : ''))).join('') + '</div>';
      }
      if (question.alternatives?.length) answer += '<p class="subnote">長音は、上に線をつける書き方でも、かなに合わせる書き方でも答えられるよ。</p>';
    } else if (!turn.done) {
      answer = '<div class="choices" aria-label="答えの候補">' + turn.choices.map((choice,i) => action('choose',escape(choice),question.type==='rule'||question.type==='read' ? 'choice' : 'choice latin','data-index="' + i + '"')).join('') + '</div>';
      if (question.type === 'build') answer += '<div class="controls wrap">' + action('erase','１文字けす','quiet','id="erase"' + (!turn.value?' disabled':'')) +
        action('check','たしかめる','primary','id="check"' + (turn.value.length!==actual.length?' disabled':'')) + '</div>';
    }
    if (!turn.done && question.type === 'build') {
      answer += '<div class="mode-switch">' + action('toggle-build',alt ? '文字カードで ならべる' : 'キーボードで ぜんぶ書く','text-button','id="toggle-build"') + '</div>';
    }
    const hint = turn.hints ? '<div class="hint" id="hint"><strong>' + (turn.hints === 1 ? '見るところ' : '見本') + '</strong><p>' + escape(question.clue || question.explanation) + '</p>' +
      (turn.hints > 1 ? '<p class="model-answer">' + (question.type==='read' ? escape(question.kana) : question.type==='rule' ? escape(model) : latin(model)) + '</p>' : '') + '</div>' : '';
    const feedback = turn.done ? '<div class="feedback success"><strong>' + (question.type==='rule' ? '見方を たしかめた！' : turn.hints || turn.mistakes ? 'たしかめて できた！' : '自分で できた！') + '</strong><p>' +
      (question.type==='rule' ? escape(question.explanation) : latin(turn.checked || model) + ' ↔ ' + escape(question.kana)) + '</p>' + (question.type==='read' ? listen(question.kana) : '') + '</div>' :
      turn.message ? '<p class="feedback" id="retry">' + escape(turn.message) + '</p>' : '';
    app.innerHTML = '<a class="back" href="' + (run.review ? '#map' : '#lesson/' + stage.id) + '" data-action="leave">← ' + (run.review ? 'しまへ' : '見本にもどる') + '</a>' +
      '<div class="bar practice-top"><span class="kicker">' + (run.review ? 'ふくしゅう' : stage.icon + ' ' + stage.place) + '</span><span>' + (run.index+1) + ' / ' + run.queue.length + '</span></div>' +
      '<section class="board practice"><h1 id="question-title" tabindex="-1">' + practiceHeading(question) + '</h1>' +
      task + answer + hint + feedback + '</section>' +
      '<div class="practice-actions">' +
      (turn.done ? action('next',run.index+1===run.queue.length ? 'おわりへ →' : 'つぎへ →','primary','id="next-question"') :
        action('hint', turn.hints === 0 ? 'ヒント' : '見本を見る','quiet','id="hint-button"' + (turn.hints >= 2 ? ' disabled' : '')) +
        action('skip','あとで やる','text-button')) + '</div>';
    if (focusSelector) {
      const target = app.querySelector(focusSelector);
      if (target && !target.disabled) target.focus({preventScroll:true});
      else app.querySelector('#question-title').focus({preventScroll:true});
    }
  }

  function record(entry, outcome) {
    if (entry.index === null) return;
    const key = itemKey(entry.stage,entry.index);
    const previous = progress.items[key];
    const isIndependent = outcome === 'independent';
    const newDay = !previous || previous.day !== today();
    const level = isIndependent ? Math.min(3,(previous?.level || 0) + (newDay ? 1 : 0)) : 0;
    const delay = [1,1,3,7][level];
    progress.items[key] = {level, due:today()+delay, day:today(), outcome};
    storageAvailable = save();
  }

  function normalizeRoman(text) {
    return text.normalize('NFKC').trim().replace(/[’‘]/g,"'").replace(/ +/g,' ');
  }

  function check(value) {
    const question = currentQuestion();
    const turn = run.turn;
    if (turn.done) return;
    const full = question.type === 'build' && turn.mode === 'full';
    const comparison = raw => {
      if (!full) return raw;
      const normalized = normalizeRoman(raw);
      return currentEntry().stage.id === 'names' ? normalized : normalized.toLowerCase();
    };
    const candidates = [expectedValue(question), ...(turn.mode==='full' ? question.alternatives || [] : [])];
    if (candidates.some(candidate => comparison(candidate) === comparison(value))) {
      turn.done = true;
      turn.checked = full ? normalizeRoman(value) : '';
      const supported = turn.hints > 0 || turn.mistakes > 0;
      record(currentEntry(), supported ? 'assisted' : 'independent');
      if (question.type !== 'rule') {
        if (supported) run.assisted++;
        else run.independent++;
      }
      showPractice('#next-question');
      note(supported ? 'たしかめて、できた。' : 'できた。');
    } else {
      turn.mistakes++;
      turn.hints = Math.max(1,turn.hints);
      turn.message = '見るところを たしかめて、もう一度。';
      showPractice(turn.mode==='full' ? '#full-answer' : question.type==='build' ? '#erase' : '[data-index="0"]');
      note(turn.message + ' ' + (question.clue || question.explanation));
    }
  }

  function finishSession() {
    const {stage, review, independent, assisted} = run;
    const completed = independent+assisted === run.queue.filter(entry => entry.index !== null).length;
    if (!review && completed) {
      progress.stops[stage.id] = true;
      storageAvailable = save();
    }
    const nextStage = stage ? stages[stages.indexOf(stage)+1] : null;
    const lead = review ? 'きょうの ふくしゅう' : stage.icon + ' ' + stage.place;
    const skipped = run.queue.filter(entry => entry.index !== null).length-independent-assisted;
    app.innerHTML = '<section class="board finish">' +
      (!review && completed ? '<div class="delivered"><div><span aria-hidden="true">' + stage.icon + '</span>' + latin(signs[stage.id]) + '</div></div>' :
        '<span class="finish-icon" aria-hidden="true">' + (review ? '🌿' : stage.icon) + '</span>') +
      title(lead,review ? 'ふくしゅう おわり' : completed ? escape(stage.reward) : 'ここまで できたね', 'また来たときに、少しずつ 思い出そう。') +
      '<dl class="results"><div><dt>自分で できた</dt><dd>' + independent + ' 問</dd></div><div><dt>たしかめて できた</dt><dd>' + assisted + ' 問</dd></div>' +
      (skipped ? '<div><dt>あとで やる</dt><dd>' + skipped + ' 問</dd></div>' : '') + '</dl><div class="actions center">' +
      (review ? '<a class="primary" href="#map">しまへ →</a>' : action('more','もうひとあそび','primary')) +
      (!review && nextStage ? '<a class="quiet" href="#lesson/' + nextStage.id + '">つぎの場所へ</a>' : '') +
      (!review ? '<a class="quiet" href="#map">地図へ</a>' : '') +
      (review && available().length ? action('start-review','残りを ふくしゅう','quiet') : '') + '</div></section>';
    app.focus();
  }

  function advance() {
    run.index++;
    if (run.index >= run.queue.length) finishSession();
    else beginQuestion();
  }

  function showReview() {
    const due = available().length;
    const records = Object.values(progress.items);
    const seen = records.length;
    app.innerHTML = title('あとで もう一度','ふくしゅう', due ? '思い出す日になった問題から、少しずつ出すよ。' : seen ? 'きょうの分は おしまい。次のふくしゅうの日に、また来てね。' : 'しまの場所で練習すると、あとから ふくしゅうできるよ。') +
      '<section class="board review-box"><h2>' + (due ? 'きょうは ' + due + ' 問' : seen ? 'きょうの ふくしゅうは ありません' : 'まずは しまを めぐろう') + '</h2>' +
      (seen ? '<p>れんしゅうした問題 ' + seen + ' 問</p>' : '') +
      (!storageAvailable ? '<p>この端末の設定では、閉じると記録を保存できません。</p>' : '') +
      (due ? action('start-review','はじめる →','primary') : '<a class="primary" href="#map">しまの地図へ →</a>') + '</section>';
  }

  function showTable() {
    const groups = tableKind ? blends : rows;
    app.innerHTML = title('見ながら つくろう','ローマ字表','文字を押すと、かなの音を聞けるよ。') +
      '<div class="controls wrap table-switch">' + ['きほんの表','小さい ゃ・ゅ・ょ'].map((label,i) => action('table-kind',label,'quiet','data-index="' + i + '" aria-pressed="' + (tableKind===i) + '"')).join('') + '</div>' +
      '<section class="table-board"><table><caption>' + (tableKind ? '小さい「ゃ・ゅ・ょ」の表' : 'きほんの表') + '</caption><thead><tr><th scope="col">行</th>' +
      (tableKind ? ['a','u','o'] : LandLessons.vowels).map(letter=>'<th scope="col">' + letter + '</th>').join('') + '</tr></thead><tbody>' +
      groups.map(row => {
        const columns = tableKind ? ['a','u','o'] : LandLessons.vowels;
        const cells = columns.map(end => row.spelling.findIndex(spelling => spelling.endsWith(end)));
        return '<tr><th scope="row">' + row.label + '</th>' + cells.map(index => index < 0 ? '<td></td>' : '<td>' + action('speak',latin(row.spelling[index]) + '<small>' + row.kana[index] + '</small>','table-cell','data-text="' + row.kana[index] + '"') + '</td>').join('') + '</tr>';
      }).join('') + '</tbody></table></section>' +
      (!tableKind ? '<p class="subnote">「ん」の書き方は ' + action('speak',latin('n') + '（ん）','quiet','data-text="ん"') + '</p>' : '') +
      '<p class="subnote">「お」と「を」は o、「じ」と「ぢ」は ji、「ず」と「づ」は zu。文の中の助詞「は・へ・を」は wa・e・o と書くよ。</p>';
  }

  function showPaper() {
    const stage = stageFor(paperStageId);
    app.innerHTML = title('国語の ローマ字','紙に 書こう','紙とえんぴつを用意してね。書いてから、見本とくらべよう。') +
      '<div class="bar paper-controls"><label for="paper-select">何を書く？</label><select id="paper-select">' +
      stages.map(entry => '<option value="' + entry.id + '"' + (entry===stage?' selected':'') + '>' + entry.title + '</option>').join('') +
      '</select></div><section class="board paper-set"><h2>' + stage.title + '</h2>' +
      paper[stage.id].map(([kana,answer,clue]) => '<article class="paper-word"><h3>' + escape(kana) + '</h3>' +
        listen(kana) + fourLines() + '<details class="paper-example"><summary>書いたら 見本を見る</summary><div class="paper-models">' +
        answer.split(' ／ ').map(word => fourLines(word)).join('') + '<p>' + escape(clue) + '</p></div></details></article>').join('') + '</section>' +
      '<div class="actions paper-controls">' + action('print','印刷する','quiet') + '<a class="quiet" href="#lesson/' + stage.id + '">見本で れんしゅう</a></div>';
    LandWriting.load(app);
  }

  function fourLines(word = '') {
    return '<div class="four-lines"' + (word ? ' data-word="' + escape(word) + '"' : ' aria-hidden="true"') + '>' +
      '<span aria-hidden="true" class="writing-rules">' + '<i class="writing-rule"></i>'.repeat(4) + '</span>' +
      (word ? '<canvas aria-hidden="true"></canvas><span class="sr" lang="en">' + escape(word) + '</span>' : '') + '</div>';
  }

  function showTeacher() {
    const records = Object.values(progress.items);
    app.innerHTML = title('授業と 個別練習','先生・保護者の方へ','見本を一つ選び、児童が指さしたり言葉にしたりする時間を取れます。') +
      '<section class="board tip"><h2>説明の見本をひらく</h2><div class="teacher-grid">' +
      stages.map(stage => '<a class="quiet" href="#teach/' + stage.id + '">' + stage.title + '</a>').join('') + '</div></section>' +
      '<section class="board tip"><h2>この端末の練習記録</h2><p>最後の結果を、問題ごとに記録しています。</p><dl class="results">' +
      [['independent','自力'],['assisted','支援あり'],['later','あとでやる']].map(([key,label]) => '<div><dt>' + label + '</dt><dd>' + records.filter(record => record.outcome===key).length + ' 問</dd></div>').join('') + '</dl>' +
      (!storageAvailable ? '<p>この端末の設定では、閉じると記録を保存できません。</p>' : '') +
      '<p>３問程度の練習のあと、後日、見本を閉じて別の語でも同じ見方が使えるか確かめてください。選択肢から読めたこと、文字を並べられたこと、紙に書けたことは、それぞれの課題で確かめてください。</p></section>' +
      '<section class="board tip"><h2>指導のよりどころ</h2><p>国語の表記は、令和７年の内閣告示に合わせています。例えば、長音は shōten や shouten、促音は nicchoku と書きます。国語の表記と日本語入力を、別の活動として扱います。</p><ul><li><a href="https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/roma/index2.html">文化庁「ローマ字のつづり方」</a></li><li><a href="https://assets.mitsumura-tosho.co.jp/6317/7363/6089/08s-kokugo-romaji-03-02.pdf">光村図書 令和８年度用の指導資料</a></li></ul></section>';
  }

  function typingPatterns(item) {
    return item.parts.reduce((patterns,[primary,kana,...alternatives]) =>
      patterns.flatMap(pattern => [primary,...alternatives].map(keys => [...pattern,{keys,kana}])),[[]]);
  }

  function typingState(item,value) {
    const patterns = typingPatterns(item);
    const pattern = patterns.find(candidate => candidate.map(part => part.keys).join('').startsWith(value));
    if (!pattern) return {error:true};
    const full = pattern.map(part => part.keys).join('');
    let length = 0;
    let converted = '';
    let tail = value;
    for (const part of pattern) {
      length += part.keys.length;
      if (value.length < length) break;
      if ((part.kana === 'っ' || part.kana === 'ッ') && value.length === length) break;
      tail = tail.slice(part.keys.length);
      converted += part.kana;
    }
    return {converted,tail,full,done:full===value};
  }

  function showIme() {
    const item = currentTypingItem();
    const letters = Array.from(new Set(typingPatterns(item).flatMap(pattern => [...pattern.map(part => part.keys).join('')]))).sort();
    app.innerHTML = title('キーと ゆびを たしかめる','パソコン入力',
      imeHome ? '左の人さし指を F、右の人さし指を J におこう。キーの小さなでっぱりを 手でさがしてね。' : '画面の手を見て、キーボードで日本語を出そう。') +
      '<div class="controls wrap ime-modes"><a class="quiet" href="#ime"' + (imeHome?'':' aria-current="page"') + '>ことばを打つ</a><a class="quiet" href="#ime/home"' +
      (imeHome?' aria-current="page"':'') + '>F・J から練習</a></div>' +
      '<section class="board ime"><div class="ime-top">' + (imeHome ? '<h2>F → J → F → J → F → F → J → J</h2>' :
        '<div class="bar"><label for="ime-select">ことばをえらぶ</label><select id="ime-select">' +
        typing.map((word,i) => '<option value="' + i + '"' + (i===imeIndex ? ' selected' : '') + '>' + word.kana + '</option>').join('') + '</select></div>' +
        '<div class="problem-kana"><strong>' + item.kana + '</strong>' + listen(item.kana) + '</div>') + '</div>' +
      '<form id="ime-form"><div class="ime-fields"><div><label for="ime-input">ここにキーを打とう</label><input id="ime-input" value="' + escape(imeValue) + '" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="24" inputmode="text"></div>' +
      '<div class="ime-output"><span>' + (imeHome ? '打てた文字' : '日本語が出るところ') + '</span><output id="ime-output" for="ime-input"></output></div></div><p id="ime-status" class="subnote"></p>' +
      '<div class="controls wrap"><button type="submit" class="primary">たしかめる</button>' + action('ime-reset','やりなおす','quiet') +
      (imeHome ? '' : action('ime-help',imeHelp?'見本をとじる':'打ち方を見る','quiet','id="ime-help" aria-expanded="' + imeHelp + '"')) + '</div></form>' +
      (imeHelp ? '<div class="hint"><strong>打ち方の見本</strong><p>' + item.clue + '</p>' + tiles(item.parts.map(part=>part[0])) + '</div>' : '') +
      '<div class="ime-board-controls controls wrap">' + action('ime-guide','ゆびのガイド','quiet','id="ime-guide" aria-pressed="' + progress.fingerGuide + '"') +
      '<span class="subnote">手の大きさに合わせて、使いやすい指で打ってもいいよ。</span></div>' + LandKeyboard.markup() +
      '<div class="choices ime-keys" aria-label="大きなボタンでタップ入力">' + letters.map(key => action('ime-key',escape(key),'choice latin','data-key="' + escape(key) + '"')).join('') +
      action('ime-back','けす','quiet') + '</div>' + (imeHome ? '' : '<div class="controls wrap">' +
      action('ime-prev','← まえ','quiet',imeIndex===0?'disabled':'') + action('ime-next','つぎのことば →','quiet',imeIndex===typing.length-1?'disabled':'') +
      '</div><p class="subnote">キーボードを使うときは、英字入力で打つよ。</p>') +
      (item.kana==='ほんや' ? '<details class="hint"><summary>紙とパソコンのちがいを見る</summary><p>紙でローマ字を書くと <b class="latin">hon’ya</b>。日本語を出すキーは <b class="latin">HONNYA</b> でいいよ。</p><a href="#paper/n">紙に書く見本へ →</a></details>' : '') + '</section>';
    updateIme();
    keyboardResize?.disconnect();
    if ('ResizeObserver' in window) {
      keyboardResize = new ResizeObserver(() => {
        const keyboard = app.querySelector('.finger-board');
        if (keyboard) LandKeyboard.draw(keyboard,keyboard.dataset.next,progress.fingerGuide);
      });
      keyboardResize.observe(app.querySelector('.keyboard-grid'));
    }
  }

  const homeTyping = {parts:[...'fjfjffjj'].map(key => [key,key.toUpperCase()])};
  function currentTypingItem() {
    return imeHome ? homeTyping : typing[imeIndex];
  }

  function updateIme(submit = false) {
    const input = app.querySelector('#ime-input');
    const output = app.querySelector('#ime-output');
    const message = app.querySelector('#ime-status');
    const typed = normalizeRoman(imeValue).toLowerCase();
    const item = currentTypingItem();
    const result = typingState(item,typed);
    const length = result.error ? [...typed].findIndex((_,index) => typingState(item,typed.slice(0,index+1)).error) : typed.length;
    const preview = result.error ? typingState(item,typed.slice(0,length)) : result;
    output.textContent = (preview.converted || '') + (preview.tail || '') || '…';
    if (submit) imeDone = Boolean(result.done);
    input.setAttribute('aria-invalid', String(Boolean(result.error)));
    message.textContent = imeDone && result.done ? imeHome ? 'できた！ F と J を 交代で打てたね。' : 'できた！ 日本語で「' + item.kana + '」が出たね。' :
      result.error ? 'ここまでを見て、うしろのキーをたしかめよう。' : submit ? 'あと少し。ことばの終わりまで打とう。' : '';
    const target = imeDone ? '' : result.done ? 'Enter' : result.error ? 'Backspace' : preview.full[length] || '';
    const keyboard = app.querySelector('.finger-board');
    keyboard.dataset.next = target;
    LandKeyboard.update(keyboard,target,progress.fingerGuide);
    if (submit) note(message.textContent);
  }

  function setIme(index) {
    imeIndex = index;
    imeValue = '';
    imeHelp = false;
    imeDone = false;
    showIme();
    app.querySelector('#ime-select').focus();
  }

  function setRoute() {
    const [page,id] = location.hash.slice(1).split('/');
    route = ['map','lesson','review','table','paper','ime','teacher','teach'].includes(page) ? page : 'map';
    const stage = stageFor(id);
    if (['lesson','teach'].includes(route) && !stage) route = 'map';
    if (run && (route==='review' && run.review || route==='lesson' && !run.review && run.stage===stage)) {
      showPractice();
      return;
    }
    run = null;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    document.querySelectorAll('.site-nav a').forEach(link => {
      if (link.hash === '#' + route || route==='lesson' && link.hash==='#map') link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    });
    if (route === 'lesson' || route === 'teach') {
      lessonView = {stage,index:stage.id==='combine' || stage.id==='rows' ? 1 : 0,revealed:route==='lesson'};
      if (route === 'lesson') {
        progress.last = stage.id;
        storageAvailable = save();
      }
      showLesson(stage,route==='teach');
    } else if (route === 'review') showReview();
    else if (route === 'table') showTable();
    else if (route === 'paper') {
      if (stage) paperStageId = stage.id;
      showPaper();
    }
    else if (route === 'ime') {
      if (imeHome !== (id==='home')) {
        imeHome = id==='home';
        imeValue = '';
        imeHelp = false;
        imeDone = false;
      }
      showIme();
    }
    else if (route === 'teacher') showTeacher();
    else showMap();
    if (route!=='ime') keyboardResize?.disconnect();
    window.scrollTo(0,0);
    app.focus({preventScroll:true});
  }

  function demoAction(kind,button) {
    if (kind === 'demo-prev') lessonView.index--;
    if (kind === 'demo-next') lessonView.index++;
    if (kind === 'demo-pick') lessonView.index = Number(button.dataset.index);
    if (kind === 'demo-toggle') lessonView.revealed = !lessonView.revealed;
    showLesson(lessonView.stage,route==='teach');
    const selector = '[data-action="' + kind + '"]' + (kind==='demo-pick' ? '[aria-pressed="true"]' : ':not([disabled])');
    const target = app.querySelector(selector) || app.querySelector('[data-action="demo-toggle"]');
    target.focus({preventScroll:true});
    note('見本 ' + (lessonView.index+1) + '。' + lessonView.stage.demo[lessonView.index].kana);
  }

  app.addEventListener('click',event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const kind = button.dataset.action;
    if (kind === 'speak') return speak(button.dataset.text);
    if (kind === 'leave') {
      run = null;
      if (location.hash === button.hash) {
        event.preventDefault();
        setRoute();
      }
      return;
    }
    if (kind.startsWith('demo-')) return demoAction(kind,button);
    if (kind === 'print') return window.print();
    if (kind === 'start') return startSession(lessonView.stage);
    if (kind === 'start-review') return startSession(null,true);
    if (kind === 'more') return startSession(run.stage);
    if (kind === 'table-kind') {
      tableKind = Number(button.dataset.index);
      showTable();
      app.querySelector('[data-action="table-kind"][data-index="' + tableKind + '"]').focus();
      return;
    }
    if (kind === 'ime-help') {
      imeHelp = !imeHelp;
      showIme();
      app.querySelector('#ime-help').focus({preventScroll:true});
      return;
    }
    if (kind === 'ime-prev') return setIme(imeIndex-1);
    if (kind === 'ime-next') return setIme(imeIndex+1);
    if (kind === 'ime-guide') {
      progress.fingerGuide = !progress.fingerGuide;
      button.setAttribute('aria-pressed',String(progress.fingerGuide));
      storageAvailable = save();
      return updateIme();
    }
    if (['ime-key','ime-keyboard','ime-back','ime-reset'].includes(kind)) {
      const key = button.dataset.key;
      if (key === 'Enter') return updateIme(true);
      if (key === 'Backspace' || kind === 'ime-back') imeValue = imeValue.slice(0,-1);
      else if (key) imeValue = (imeValue + key).slice(0,24);
      else imeValue = '';
      imeDone = false;
      const input = app.querySelector('#ime-input');
      input.value = imeValue;
      input.setSelectionRange(imeValue.length,imeValue.length);
      return updateIme();
    }
    if (!run) return;
    const turn = run.turn;
    const question = currentQuestion();
    if (kind === 'insert-symbol') {
      const field = app.querySelector('#full-answer');
      field.setRangeText(button.dataset.symbol,field.selectionStart,field.selectionEnd,'end');
      turn.value = field.value;
      field.focus({preventScroll:true});
      return;
    }
    if (kind === 'next') return advance();
    if (kind === 'skip') {
      record(currentEntry(),'later');
      return advance();
    }
    if (kind === 'hint') {
      turn.hints = Math.min(2,turn.hints+1);
      showPractice(turn.hints===2 ? turn.mode==='full' ? '#full-answer' : '[data-index="0"]' : '#hint-button');
      note((question.clue || question.explanation) + (turn.hints===2 ? ' 見本を表示しました。' : ''));
    } else if (kind === 'choose') {
      const choice = turn.choices[Number(button.dataset.index)];
      if (question.type !== 'build') return check(choice);
      if (turn.value.length >= expectedValue(question).length) {
        note('文字がそろったよ。たしかめるを押そう。');
        return;
      }
      turn.value += choice;
      turn.message = '';
      const ready = turn.value.length === expectedValue(question).length;
      showPractice(ready ? '#check' : '[data-index="' + button.dataset.index + '"]');
      note(turn.value);
    } else if (kind === 'erase') {
      turn.value = turn.value.slice(0,-1);
      turn.message = '';
      showPractice(turn.value ? '#erase' : '[data-index="0"]');
    } else if (kind === 'toggle-build') {
      turn.mode = turn.mode === 'full' ? 'pieces' : 'full';
      turn.value = '';
      turn.message = '';
      showPractice(turn.mode === 'full' ? '#full-answer' : '#toggle-build');
    } else if (kind === 'check') {
      check(turn.value);
    }
  });

  app.addEventListener('submit',event => {
    if (event.target.id === 'full-form') {
      event.preventDefault();
      run.turn.value = new FormData(event.target).get('answer');
      if (!run.turn.value.trim()) return note('文字を入れてから、たしかめよう。');
      check(run.turn.value);
    } else if (event.target.id === 'ime-form') {
      event.preventDefault();
      updateIme(true);
    }
  });

  app.addEventListener('pointerdown',event => {
    if (event.pointerType === 'mouse' && document.activeElement?.id === 'ime-input' &&
        event.target.closest('[data-action="ime-keyboard"], [data-action="ime-key"]')) {
      event.preventDefault();
    }
  });

  app.addEventListener('input',event => {
    if (event.target.id === 'ime-input') {
      imeValue = event.target.value;
      imeDone = false;
      updateIme();
    }
    if (event.target.id === 'full-answer') run.turn.value = event.target.value;
  });

  app.addEventListener('change',event => {
    if (event.target.id === 'ime-select') setIme(Number(event.target.value));
    if (event.target.id === 'paper-select') {
      location.hash = 'paper/' + event.target.value;
    }
  });

  soundButton.addEventListener('click',() => {
    progress.sound = !progress.sound;
    if (!progress.sound && 'speechSynthesis' in window) speechSynthesis.cancel();
    storageAvailable = save();
    syncSound();
  });
  document.querySelector('.skip').addEventListener('click',event => {
    event.preventDefault();
    app.focus();
  });
  window.addEventListener('hashchange',setRoute);
  syncSound();
  setRoute();
})();
