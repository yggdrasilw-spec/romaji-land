'use strict';

const LandLessons = (() => {
  const vowels = ['a', 'i', 'u', 'e', 'o'];
  const rows = [
    ['あ行','あいうえお','a i u e o'], ['か行','かきくけこ','ka ki ku ke ko'], ['さ行','さしすせそ','sa shi su se so'],
    ['た行','たちつてと','ta chi tsu te to'], ['な行','なにぬねの','na ni nu ne no'], ['は行','はひふへほ','ha hi fu he ho'],
    ['ま行','まみむめも','ma mi mu me mo'], ['や行','やゆよ','ya yu yo'], ['ら行','らりるれろ','ra ri ru re ro'],
    ['わ行','わを','wa o'], ['が行','がぎぐげご','ga gi gu ge go'], ['ざ行','ざじずぜぞ','za ji zu ze zo'],
    ['だ行','だぢづでど','da ji zu de do'], ['ば行','ばびぶべぼ','ba bi bu be bo'], ['ぱ行','ぱぴぷぺぽ','pa pi pu pe po']
  ].map(([label, kana, spelling]) => ({label, kana: [...kana], spelling: spelling.split(' ')}));
  const blends = [
    ['き','ky'], ['し','sh'], ['ち','ch'], ['に','ny'], ['ひ','hy'], ['み','my'], ['り','ry'],
    ['ぎ','gy'], ['じ','j'], ['ぢ','j'], ['び','by'], ['ぴ','py']
  ].map(([base, head]) => ({
    label: base + '＋小さい字', kana: ['ゃ', 'ゅ', 'ょ'].map(tail => base + tail),
    spelling: ['a', 'u', 'o'].map(end => head + end)
  }));

  const gap = (kana, parts, at, choices, clue, extra = {}) => ({type:'gap', kana, parts, at, choices, clue, ...extra});
  const read = (kana, spelling, others, clue) => ({type:'read', kana, spelling, choices:[kana, ...others], clue});
  const build = (kana, chunks, at, letters, clue, alternatives = []) => ({type:'build', kana, chunks, at, letters, clue, alternatives});
  const rule = (prompt, answer, other, explanation) => ({type:'rule', prompt, choices:[answer, other], explanation});
  const stages = [
    {
      id:'vowels', icon:'🌱', title:'５つの母音', place:'はなの庭', subtitle:'音をきいて、母音をえらぼう',
      instruction:'「あ・い・う・え・お」。形と音を、ひとつずつ結びつけるよ。',
      spotlight:'母音', demo:rows[0].kana.map((kana, i) => ({kana, parts:[vowels[i]], at:0})),
      say:'「あ」は a。「い」は i。',
      rule:rule('「い」を書く文字は？','i','a','「い」は i。「あ」は a。'),
      items:[gap('い',['i'],0,['a','i'],'「い」の音をきいてみよう。'), read('お','o',['あ','う'],'５つの母音の表を見よう。'), build('あお',['a','o'],0,['a','o','u'],'「あ」「お」の順だよ。'), gap('う',['u'],0,['o','u'],'「う」の音に合う字をさがそう。'), read('え','e',['い','あ'],'母音の表で、e の下を見よう。')],
      reward:'はなの庭に、あおい花がさいた！'
    },
    {
      id:'combine', icon:'🍊', title:'うしろを かえる', place:'くだもの屋', subtitle:'か行の k を使ってみよう',
      instruction:'「か」と「き」をくらべよう。うしろの文字をさわると音が変わるよ。',
      spotlight:'うしろの母音', demo:rows[1].kana.map((kana, i) => ({kana, parts:['k', vowels[i]], at:1})),
      say:'か行の k はそのまま。うしろの母音をかえると、音がかわる。',
      rule:rule('ka を ki にするとき、どこを かえる？','うしろの a','はじめの k','k はそのまま。うしろの a を i にかえるよ。'),
      items:[gap('き',['k','i'],1,['a','i'],'か行の k はそのまま。うしろを見よう。'), read('こ','ko',['く','か'],'うしろの o は「お」の母音だよ。'), build('かき',['ka','ki'],1,['i','k','a','o'],'「か」は ka。「き」のうしろは？'), gap('く',['k','u'],1,['u','e'],'うしろの母音をえらぼう。'), read('け','ke',['き','こ'],'e の音を思い出そう。'), build('ここ',['ko','ko'],1,['k','o','a'],'「こ」が２回。うしろの母音も同じ。')],
      reward:'くだもの屋に、かきのふだを出せた！'
    },
    {
      id:'rows', icon:'🚃', title:'はじめを かえる', place:'ことばの駅', subtitle:'同じ母音を、別の行でも使おう',
      instruction:'「か・な・ま」をくらべよう。おわりは同じ a だよ。',
      spotlight:'はじめの文字', demo:[{kana:'か',parts:['k','a'],at:0},{kana:'な',parts:['n','a'],at:0},{kana:'ま',parts:['m','a'],at:0},{kana:'ぱ',parts:['p','a'],at:0},{kana:'が',parts:['g','a'],at:0},{kana:'ば',parts:['b','a'],at:0},{kana:'ら',parts:['r','a'],at:0},{kana:'や',parts:['y','a'],at:0},{kana:'わ',parts:['w','a'],at:0}],
      say:'母音 a はそのまま。はじめの文字が変わると、行が変わる。',
      rule:rule('ka を ma にするとき、どこを かえる？','はじめの k','うしろの a','うしろは a のまま。はじめの k を m にかえるよ。'),
      items:[gap('な',['n','a'],0,['m','n'],'うしろは a。な行のはじめをえらぼう。'), read('み','mi',['に','ま'],'はじめの m はま行。うしろは i。'), build('なみ',['na','mi'],1,['m','n','a','i'],'「な」は na。「み」は何行かな。'), gap('が',['g','a'],0,['k','g'],'が行は g ではじまるよ。'), read('ば','ba',['ぱ','は'],'b はば行。うしろの a は同じ。'), build('やま',['ya','ma'],1,['m','y','n','a'],'「や・ま」の順。どちらもうしろは a。'), read('ら','ra',['わ','な'],'はじめの r はら行。')],
      reward:'ことばの駅に、電車がついた！'
    },
    {
      id:'special', icon:'🐟', title:'し・ち・つ・ふ・じ', place:'魚の市場', subtitle:'形に目を向けて、まとまりで読む',
      instruction:'さ行の「し」は shi。しの sh、ちの ch、つの ts を、かたまりで見よう。',
      spotlight:'はじめのまとまり', demo:[{kana:'し',parts:['sh','i'],at:0},{kana:'ち',parts:['ch','i'],at:0},{kana:'つ',parts:['ts','u'],at:0},{kana:'ふ',parts:['f','u'],at:0},{kana:'じ',parts:['j','i'],at:0}],
      say:'「し」は sh と i。「ち」は ch と i。おわりは同じ i。',
      rule:rule('shi と chi で、同じなのは？','おわりの i','はじめのまとまり','おわりの i は同じ。はじめは sh と ch。'),
      items:[gap('し',['sh','i'],0,['ch','sh'],'「し」は sh のかたまり。'), read('ち','chi',['し','つ'],'はじめの ch を見よう。'), build('すし',['su','shi'],1,['s','i','h','u'],'「し」のはじめは sh。さいごに i。'), gap('つ',['ts','u'],0,['ts','ch'],'「つ」のはじめは ts。'), read('ふ','fu',['つ','ほ'],'f で始まる「ふ」だよ。'), gap('じ',['j','i'],0,['sh','j'],'「じ」は j で始まる。'), build('ふね',['fu','ne'],0,['f','u','n','h'],'「ふ」は f と u。')],
      reward:'市場に、すしのふだがならんだ！'
    },
    {
      id:'blends', icon:'🦋', title:'小さい ゃ・ゅ・ょ', place:'ちょうの道', subtitle:'小さい字をふくむ、ひとまとまり',
      instruction:'「きゃ」は「き」と小さい「ゃ」で、ひとまとまり。「きや」と聞きくらべよう。',
      spotlight:'おわりの母音', demo:[{kana:'きや',parts:['ki','ya'],at:1},{kana:'きゃ',parts:['ky','a'],at:1},{kana:'きゅ',parts:['ky','u'],at:1},{kana:'きょ',parts:['ky','o'],at:1},{kana:'しゃ',parts:['sh','a'],at:1},{kana:'しゅ',parts:['sh','u'],at:1},{kana:'しょ',parts:['sh','o'],at:1},{kana:'ちゃ',parts:['ch','a'],at:1},{kana:'じょ',parts:['j','o'],at:1}],
      say:'きゃ・きゅ・きょは ky が同じ。しゃ・しゅ・しょは sh が同じ。',
      rule:rule('sha・shu・sho で、同じなのは？','はじめの sh','おわりの母音','しゃ・しゅ・しょのはじめは sh。うしろの母音がかわる。'),
      items:[gap('きゅ',['ky','u'],1,['o','u'],'ky のあとで、小さい「ゅ」に合う母音をえらぼう。'), read('しょ','sho',['しゃ','しゅ'],'sh は「しゃ・しゅ・しょ」。おわりは o。'), build('おちゃ',['o','cha'],1,['c','a','h','y'],'「ちゃ」は ch と a。'), gap('しゃ',['sh','a'],0,['sh','sy'],'「しゃ」は sh と a。'), read('じゃ','ja',['ちゃ','しゃ'],'はじめは j。'), gap('にょ',['ny','o'],1,['o','u'],'小さい「ょ」の母音は o。')],
      reward:'ちょうが、小道に集まってきた！'
    },
    {
      id:'double', icon:'✉️', title:'小さい っ', place:'ゆうびん屋', subtitle:'右の文字を、ひとつ写す',
      instruction:'「きて」と「きって」を聞きくらべよう。小さい「っ」があったら右を見る。',
      spotlight:'「っ」が写す文字', demo:[{kana:'きて',parts:['ki','te'],at:1},{kana:'きって',parts:['ki','t','te'],at:1},{kana:'さっか',parts:['sa','k','ka'],at:1},{kana:'ざっし',parts:['za','s','shi'],at:1},{kana:'にっちょく',parts:['ni','c','cho','ku'],at:1}],
      say:'小さい「っ」は、すぐ右のつづりの、はじめの１文字を写す。',
      rule:rule('「っ」の文字をさがすとき、どこを見る？','「っ」のすぐ右','「っ」のすぐ左','きってなら右の te。はじめの t を写すよ。'),
      items:[gap('きって',['ki','t','te'],1,['k','t'],'「っ」のすぐ右は「て」。te の先頭を見よう。'), read('さっか','sakka',['さか','さっき'],'kk があるよ。２つ目の k は ka のはじめ。'), build('しっぽ',['shi','p','po'],1,['p','t','s'],'「ぽ」は po。そのはじめの１文字を写す。'), gap('ざっし',['za','s','shi'],1,['s','sh'],'shi の先頭１文字だけを写そう。'), gap('にっちょく',['ni','c','cho','ku'],1,['t','c'],'cho の先頭１文字はどれかな。'), read('きって','kitte',['きて','きった'],'tt があるよ。うしろは te。')],
      reward:'きってを貼って、手紙を出せた！'
    },
    {
      id:'n', icon:'📚', title:'「ん」と 音の切れ目', place:'本屋', subtitle:'n のうしろを見よう',
      instruction:'「ん」は n。すぐあとに母音字や y がくるときは、間に ’ を入れて切れ目を見せるよ。',
      spotlight:'n のすぐあと', demo:[{kana:'ほん｜や',sound:'ほんや',parts:['ho','n’','ya'],at:1},{kana:'ほ｜にゃ',sound:'ほにゃ',parts:['ho','nya'],at:1},{kana:'ぜん｜いん',sound:'ぜんいん',parts:['ze','n’','i','n'],at:1},{kana:'ほん',parts:['ho','n'],at:1},{kana:'しんぶん',parts:['shi','n','bu','n'],at:1}],
      say:'「ん」のあとが a・i・u・e・o・y なら、n のあとに ’ を入れる。',
      rule:rule('「ほんや」で ’ を入れるのは？','n と y のあいだ','y と a のあいだ','hon と ya のあいだに切れ目を入れるよ。'),
      items:[gap('ほんや',['ho','n’','ya'],1,['n','n’'],'「ん」の次は「や」。ya の y を見よう。'), read('ぜんいん','zen’in',['ぜにん','ぜんねん'],'n’ のあとで切ると、ze・n・i・n。'), build('ほんや',['ho','n’','ya'],1,['n','’','y'],'「ん」のすぐあとが ya。n のうしろに切れ目のしるしを置く。'), gap('たんい',['ta','n’','i'],1,['n’','n'],'うしろの i は母音字だよ。'), gap('しんぶん',['shi','n','bu','n'],1,['n','m'],'「ん」のつづりは n。「ぶ」は b から始まる。'), build('ほん',['ho','n'],1,['n','’','m'],'「ん」のあとに文字はあるかな。')],
      reward:'本屋のふだを、読みやすくできた！'
    },
    {
      id:'long', icon:'🏮', title:'のばす音', place:'商店街', subtitle:'長くきこえる音を見つける',
      instruction:'「しょてん」と「しょうてん」。長く聞こえる o の上に、横の線をつける書き方があるよ。',
      spotlight:'長く聞こえる母音', demo:[{kana:'しょてん',parts:['sh','o','ten'],at:1},{kana:'しょうてん',parts:['sh','ō','ten'],at:1},{kana:'しょうてん（かなに合わせる）',sound:'しょうてん',parts:['sh','ou','ten'],at:1},{kana:'こおり',parts:['k','ō','ri'],at:1},{kana:'こおり（かなに合わせる）',sound:'こおり',parts:['k','oo','ri'],at:1},{kana:'しいたけ',parts:['sh','ii','take'],at:1},{kana:'とけい',parts:['tok','ei'],at:1}],
      say:'のばす音は、母音の上の線や、かなに合わせて母音字をならべる書き方で表せる。',
      rule:rule('shōten の横の線は、何を知らせる？','o の音をのばす','次の文字を２つにする','ō は o の音を長く言うしるし。'),
      items:[gap('しょうてん',['sh','ō','ten'],1,['o','ō'],'音が長いほう。ここでは上に線をつけよう。'), read('こおり','kōri',['こり','きり'],'ō は o をのばすしるし。'), build('かあさん',['k','ā','san'],1,['a','ā','o'],'「か」の a をのばすよ。ここでは上に線をつけよう。',['kaasan','kâsan']), gap('おとうさん',['ot','ou','san'],1,['oo','ou'],'母音字をならべる書き方。「と・う」のかなに合わせる。'), read('しいたけ','shiitake',['したけ','しおたけ'],'ii が長く聞こえるところ。'), gap('こおり',['k','oo','ri'],1,['oo','ou'],'母音字をならべる書き方。「こ・お」のかなに合わせる。')],
      reward:'商店街の、あかりがついた！'
    },
    {
      id:'names', icon:'📮', title:'名前・地名の 大文字', place:'しまの役場', subtitle:'名前の先頭を見つけよう',
      instruction:'人の名前や地名は、はじめの文字を大文字にするよ。',
      spotlight:'名前のはじめ', demo:[{kana:'きむら',parts:['K','imura'],at:0},{kana:'あおい',parts:['A','oi'],at:0},{kana:'きむら あおい',parts:['K','imura ','A','oi'],at:[0,2]},{kana:'おきなわ',parts:['O','kinawa'],at:0}],
      say:'名前のはじめは大文字。名字と名前があれば、それぞれのはじめを見る。',
      rule:rule('Kimura Aoi で、大文字はどれ？','K と A','K と i','名字は K から。名前は A から。'),
      items:[gap('木村 あおい',['Kimura ','A','oi'],1,['a','A'],'名字と名前、それぞれのはじめを見よう。',{sound:'きむら あおい'}), gap('沖縄',['O','kinawa'],0,['o','O'],'地名のはじめは大文字。',{sound:'おきなわ'}), build('あおい',['A','oi'],0,['A','a','O'],'人の名前「あおい」のはじめは大文字。'), gap('田中 はな',['T','anaka ','H','ana'],2,['H','h'],'「はな」は名前。はじめの字を見よう。',{sound:'たなか はな'}), gap('奈良',['N','ara'],0,['n','N'],'地名のはじめを見よう。',{sound:'なら'})],
      reward:'役場に、名前のふだをとどけた！'
    }
  ];

  const typing = [
    {kana:'ねこ', parts:[['ne','ね'],['ko','こ']], clue:'ne を打つと「ね」。つぎに ko で「こ」。'},
    {kana:'ふね', parts:[['fu','ふ','hu'],['ne','ね']], clue:'「ふ」は fu でも hu でも入力できるよ。'},
    {kana:'きって', parts:[['ki','き'],['t','っ'],['te','て']], clue:'次の te の t を重ねると、小さい「っ」が出るよ。'},
    {kana:'ほんや', parts:[['ho','ほ'],['nn','ん',"n'"],['ya','や']], clue:'n を２回打つと「ん」。そのあと ya を打つよ。'},
    {kana:'みかん', parts:[['mi','み'],['ka','か'],['nn','ん']], clue:'最後の「ん」も、この練習では nn で確定しよう。'},
    {kana:'えをかく', parts:[['e','え'],['wo','を'],['ka','か'],['ku','く']], clue:'日本語入力で「を」を出すキーは wo。'},
    {kana:'がっこう', parts:[['ga','が'],['k','っ'],['ko','こ'],['u','う']], clue:'入力は、かなの「こ」「う」に合わせて ko のあとに u。'},
    {kana:'プール', parts:[['pu','プ'],['-','ー'],['ru','ル']], clue:'「ー」は - のキー。カタカナで出るところを見よう。'},
    {kana:'あめ', parts:[['a','あ'],['me','め']], clue:'「あ」は a。「め」は me。'},
    {kana:'さくら', parts:[['sa','さ'],['ku','く'],['ra','ら']], clue:'「さ」「く」「ら」を順につなげる。'},
    {kana:'ゆうやけ', parts:[['yu','ゆ'],['u','う'],['ya','や'],['ke','け']], clue:'かなの「ゆ・う」に合わせて yu のあとに u。'},
    {kana:'こおり', parts:[['ko','こ'],['o','お'],['ri','り']], clue:'かなの「こ・お」に合わせて ko のあとに o。'},
    {kana:'おかあさん', parts:[['o','お'],['ka','か'],['a','あ'],['sa','さ'],['nn','ん']], clue:'「か・あ」は ka のあとに a。最後の「ん」は nn で出そう。'},
    {kana:'サッカー', parts:[['sa','サ'],['k','ッ'],['ka','カ'],['-','ー']], clue:'小さい「ッ」は k を重ねる。長音の「ー」は -。'}
  ];

  const paper = {
    vowels:[['あお','ao','「あ」「お」のじゅん。'],['うえ','ue','「う」のあとに「え」。'],['いえ','ie','「い」と「え」は、ちがう母音。']],
    combine:[['かき','kaki','か行は k。うしろは a → i。'],['かく','kaku','ka のあとに ku。'],['きく','kiku','ka と同じ k を使えるよ。']],
    rows:[['なみ','nami','「な」は n、「み」は m で始まる。'],['やま','yama','ya と ma は、おわりの a が同じ。'],['ばら','bara','ba と ra をつなげる。']],
    special:[['すし','sushi','「し」は sh と i。'],['ふね','fune','「ふ」は f と u。'],['ちず','chizu','「ち」は ch と i。']],
    blends:[['おちゃ','ocha','「ちゃ」は ch と a。'],['しゃしん','shashin','「しゃ」は sh と a。「し」は sh と i。'],['きょねん','kyonen','「きょ」は ky と o。']],
    double:[['きって','kitte','小さい「っ」の右は te。t を写す。'],['しっぽ','shippo','「ぽ」は po。p を写す。'],['ざっし','zasshi','shi の先頭の s だけを写す。']],
    n:[['ほんや','hon’ya','「ん」n と「や」ya のあいだに ’ を小さく書く。'],['たんい','tan’i','n のあとが母音字 i。あいだに ’。'],['しんぶん','shinbun','n の次は b、または語のおわり。ここには ’ を入れない。']],
    long:[['しょうてん','shōten ／ shouten','長い o に横線。かなに合わせると ou。'],['こおり','kōri ／ koori','上に線をつけると ō。かなに合わせると oo。'],['しいたけ','shiitake','「しい」は ii とならべる書き方が一般的。']],
    names:[['きむら あおい','Kimura Aoi','名字と名前の先頭を、大文字にする。'],['おきなわ','Okinawa','地名の先頭を、大文字にする。'],['なら','Nara','地名の先頭を、大文字にする。']]
  };

  const signs = {vowels:'ao',combine:'kaki',rows:'yama',special:'sushi',blends:'ocha',double:'kitte',n:'hon’ya',long:'shōten',names:'Okinawa'};
  return {vowels, rows, blends, stages, typing, paper, signs};
})();
