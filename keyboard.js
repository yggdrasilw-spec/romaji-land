'use strict';

const LandKeyboard = (() => {
  const fingers = [
    {name:'左の 小指',home:'a'}, {name:'左の 薬指',home:'s'}, {name:'左の 中指',home:'d'}, {name:'左の 人さし指',home:'f'},
    {name:'右の 人さし指',home:'j'}, {name:'右の 中指',home:'k'}, {name:'右の 薬指',home:'l'}, {name:'右の 小指',home:';'}
  ];
  const assignments = ['1qaz','2wsx','3edc','45rtfgvb','67yuhjnm','8ik,','9ol.','0-p@[];:/'];
  const rows = [
    [['半角',1.22],...'1234567890-^'.split(''),['¥',1],['Backspace',1.62,'⌫']],
    [['Tab',1.44],...'qwertyuiop@['.split(''),['Enter',2.40,'Enter']],
    [['Caps',1.76],...'asdfghjkl;:]'.split(''),['',2.08]],
    [['Shift',2.11],...'zxcvbnm,./'.split(''),['\\',1],['Shift',2.73]]
  ];

  function fingerFor(key) {
    if (key === 'Enter' || key === 'Backspace') return fingers[7];
    const index = assignments.findIndex(group => group.includes(key));
    return index === -1 ? null : fingers[index];
  }

  function markup() {
    return '<section class="finger-board" aria-label="キーボードと指のガイド"><div class="finger-head"><h2>キーと ゆび</h2>' +
      '<p id="finger-instruction"></p></div><div class="keyboard-grid">' +
      rows.map(row => '<div class="keyboard-row">' + row.map(entry => {
        const [key,width,label] = Array.isArray(entry) ? entry : [entry,1];
        const typed = /^[a-z-]$/.test(key) || key === 'Enter' || key === 'Backspace';
        const home = key === 'f' || key === 'j';
        const visible = label || key.toUpperCase();
        const classes = 'keycap' + (home ? ' home-key' : '');
        const style = 'style="--units:' + width + '"';
        const aria = key==='Backspace'?'１文字けす':key==='Enter'?'Enter でたしかめる':visible;
        return typed ?
          '<button type="button" tabindex="-1" class="' + classes + '" ' + style + ' data-action="ime-keyboard" data-key="' + key + '" aria-label="' + aria + '">' + visible + (home ? '<i aria-hidden="true"></i>' : '') + '</button>' :
          '<span aria-hidden="true" class="' + classes + ' reference-key" ' + style + (key===';' ? ' data-position=";"' : '') + '>' + visible + '</span>';
      }).join('') + '</div>').join('') +
      '<div class="keyboard-bottom" aria-hidden="true"><span></span></div><canvas aria-hidden="true" class="hand-canvas"></canvas></div></section>';
  }

  function draw(root,next,enabled) {
    const canvas = root.querySelector('.hand-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1,2);
    canvas.width = Math.round(rect.width*ratio);
    canvas.height = Math.round(rect.height*ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio,ratio);
    if (!enabled) return;

    const keyPoint = value => {
      const key = root.querySelector('.keyboard-grid [data-key="' + value + '"], .keyboard-grid [data-position="' + value + '"]');
      if (!key) return null;
      const r = key.getBoundingClientRect();
      return {x:r.left-rect.left+r.width*.57,y:r.top-rect.top+r.height*.63,w:r.width,h:r.height};
    };
    const selected = next ? fingerFor(next) : null;
    const target = selected ? keyPoint(next) : null;

    for (const side of [0,1]) {
      const left = side===0;
      const hand = fingers.slice(side*4,side*4+4);
      const homes = hand.map(finger => keyPoint(finger.home));
      const {w,h} = homes[1];
      const center = (homes[0].x+homes[3].x)/2;
      const palmY = rect.height-h*.57;
      const theme = left ? ['rgba(221,244,235,.72)','#5d927d'] : ['rgba(225,233,249,.73)','#6c80a1'];

      const fingerStroke = (from, to, weight, outline, fill, active) => {
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(from.x,from.y);
        ctx.quadraticCurveTo(from.x+(to.x-from.x)*.24,to.y+(from.y-to.y)*.44,to.x,to.y);
        ctx.lineWidth = weight;
        ctx.strokeStyle = outline;
        ctx.stroke();
        ctx.lineWidth = Math.max(1,weight-2);
        ctx.strokeStyle = fill;
        ctx.stroke();
        if (active) {
          ctx.beginPath();
          ctx.arc(to.x,to.y,weight*.31,0,Math.PI*2);
          ctx.fillStyle = '#b65a20';
          ctx.fill();
        }
      };

      ctx.beginPath();
      ctx.ellipse(center,palmY,w*1.32,h*.57,left?-.09:.09,0,Math.PI*2);
      ctx.fillStyle = theme[0];
      ctx.fill();
      ctx.strokeStyle = theme[1];
      ctx.lineWidth = 1;
      ctx.stroke();

      const thumbDirection = left ? 1 : -1;
      fingerStroke({x:center+thumbDirection*w*.65,y:palmY+h*.08},
        {x:center+thumbDirection*w*1.79,y:palmY-h*.39},w*.61,theme[1],theme[0],false);

      const drawFinger = (finger,index,active) => {
        const base = homes[index];
        const endpoint = active ? target : {x:base.x,y:base.y+h*.17};
        if (active && next !== finger.home) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(base.x,base.y);
          ctx.lineTo(endpoint.x,endpoint.y);
          ctx.strokeStyle = '#a64d1e';
          ctx.lineWidth = 2;
          ctx.setLineDash([3,3]);
          ctx.stroke();
          ctx.restore();
        }
        const pinky = left ? index===0 : index===3;
        fingerStroke({x:center+(base.x-center)*.60,y:palmY-h*.19},endpoint,w*(pinky ? .36 : .44),
          active ? '#a54a18' : theme[1],active ? 'rgba(255,211,108,.91)' : theme[0],active);
      };
      hand.forEach((finger,index) => { if (finger!==selected || !target) drawFinger(finger,index,false); });
      if (target && hand.includes(selected)) drawFinger(selected,hand.indexOf(selected),true);
    }
  }

  function update(root,next,enabled) {
    const key = root.querySelector('.keyboard-grid .is-next');
    if (key) key.classList.remove('is-next');
    const destination = next ? root.querySelector('.keyboard-grid [data-key="' + next + '"]') : null;
    const description = root.querySelector('#finger-instruction');
    const finger = next ? fingerFor(next) : null;
    root.classList.toggle('no-finger-guide',!enabled);
    if (enabled && destination) destination.classList.add('is-next');
    if (description) {
      description.textContent = !enabled ? 'F と J の でっぱりを 手がかりに。' : next && finger ?
        (next.length===1 ? next.toUpperCase() : next) + ' は「' + finger.name + '」' :
        '左の人さし指を F、右の人さし指を J へ。';
    }
    draw(root,next,enabled);
  }

  return {markup,update,draw};
})();
