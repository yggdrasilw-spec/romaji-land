'use strict';

const LandWriting = (() => {
  const ascender = .78125;
  const capitals = 1485 / 2048;
  const xHeight = 1040 / 2048;
  const descender = .24;
  const padding = .045;
  const source = document.createElement('canvas');
  const pen = source.getContext('2d');
  const font = 'Land Andika';
  let pending = 0;

  function draw(canvas) {
    const guide = canvas.parentElement;
    if (!guide.clientWidth || !pen) return;
    const view = guide.getBoundingClientRect();
    const size = parseFloat(getComputedStyle(guide).fontSize);
    const scale = Math.min(4, Math.max(3, window.devicePixelRatio || 1));
    const inkSize = size * scale;
    const edge = Math.round(inkSize * padding);
    const top = Math.round(inkSize * ascender);
    const center = Math.round(inkSize * xHeight);
    const bottom = Math.round(inkSize * descender);
    const marks = [...guide.querySelectorAll('.writing-rule')].map(rule =>
      Math.round((rule.getBoundingClientRect().top - view.top) * scale));

    canvas.width = source.width = Math.round(view.width * scale);
    canvas.height = Math.round(view.height * scale);
    source.height = top + bottom + 2 * edge;
    pen.font = inkSize + 'px "' + font + '", sans-serif';
    pen.fillStyle = '#203b30';
    const baseline = edge + top;
    let x = inkSize * .16;
    for (const glyph of guide.dataset.word) {
      pen.save();
      pen.translate(x, baseline);
      if (/^[A-Z]$/.test(glyph)) pen.scale(1, ascender / capitals);
      pen.fillText(glyph,0,0);
      pen.restore();
      x += pen.measureText(glyph).width;
    }

    // Keep Andika's central band at its natural height and extend the outer bands
    // to the equal-spaced guide. Accents above the first rule keep their padding.
    const original = [0,edge,baseline-center,baseline,baseline+bottom,source.height];
    const aligned = [0,...marks,canvas.height];
    const output = canvas.getContext('2d');
    for (let i=0;i<original.length-1;i++) {
      output.drawImage(source,0,original[i],source.width,original[i+1]-original[i],
        0,aligned[i],canvas.width,aligned[i+1]-aligned[i]);
    }
  }

  function refresh(root = document) {
    root.querySelectorAll('.four-lines canvas').forEach(draw);
  }

  function load(root) {
    const face = document.fonts?.load('32px "' + font + '"');
    if (face) face.then(() => refresh(root), () => refresh(root));
    else refresh(root);
  }

  document.addEventListener('toggle',event => {
    if (event.target.matches('details.paper-example[open]')) load(event.target);
  },true);
  window.addEventListener('resize',() => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => refresh());
  });
  window.addEventListener('beforeprint',() => refresh());
  window.addEventListener('afterprint',() => refresh());

  return {load};
})();
