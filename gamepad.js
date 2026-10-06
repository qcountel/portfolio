// Gamepad Viewer: the same v4pro / DualShock 4 skins as the in-game overlay
// of Controllin, drawn on a canvas. Reacts to a real gamepad through the
// Gamepad API, otherwise plays a short demo loop.
(() => {
  const canvas = document.getElementById('padCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('padStatus');
  const chips = document.querySelectorAll('[data-skin]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEMO_TEXT = 'демо · подключи геймпад и нажми любую кнопку';

  // ---- colours ([r, g, b, a], a = 0..255)
  const hex = (h, a = 255) => [(h >> 16) & 255, (h >> 8) & 255, h & 255, a];
  const darker = (c, t) => { const k = 1 - t; return [c[0] * k, c[1] * k, c[2] * k, c[3]]; };
  const lighter = (c, t) => [c[0] + (255 - c[0]) * t, c[1] + (255 - c[1]) * t, c[2] + (255 - c[2]) * t, c[3]];
  const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const on = (c) => (lum(c) > 150 ? [20, 14, 10, 255] : [250, 244, 245, 255]);
  const edge = (c) => (lum(c) < 60 ? lighter(c, 0.14) : darker(c, 0.2));
  const alpha = (c, a) => [c[0], c[1], c[2], a];
  const css = (c) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${(c[3] / 255).toFixed(3)})`;
  const WHITE = hex(0xffffff);

  const V = {
    body: hex(0x2c2c30), light: hex(0xff8a1f), triggers: hex(0x161618), bumpers: hex(0x2a2a2e),
    sticks: hex(0x1d1d21), dpad: hex(0x202024), buttons: hex(0x1c1c20), letters: hex(0x8a8a90),
    pressed: hex(0xff8a1f),
  };
  const D = {
    body: hex(0xefeff1), grips: hex(0xc4272f), triggers: hex(0x9e1d24), bumpers: hex(0xc4272f),
    touchpad: hex(0xc4272f), share: hex(0xc4272f), options: hex(0xc4272f), dpad: hex(0xc4272f),
    face: hex(0x2a2a2c), wells: hex(0x070707), sticks: hex(0xcf2832), ring: hex(0xe6e6e8),
    pressed: hex(0xfff1f2), glow: hex(0xff4a55),
  };

  // ---- outlines traced from the reference photos (photo pixels)
  const VADER_BODY = [[69,116],[48,168],[27,228],[20,254],[14,288],[12,315],[14,350],[21,369],[35,381],[47,387],[62,392],[71,392],[78,388],[117,349],[144,325],[153,320],[166,317],[352,318],[364,323],[372,329],[433,388],[440,392],[449,392],[464,387],[482,377],[490,369],[497,350],[499,330],[497,288],[491,254],[472,192],[442,116],[436,110],[427,105],[424,90],[420,86],[394,74],[354,65],[347,65],[322,71],[316,75],[195,75],[189,71],[164,65],[157,65],[117,74],[91,86],[87,90],[84,105],[75,110]];
  const VADER_LB = [[86,96],[90,84],[150,65],[166,63],[180,70],[165,74],[100,92]];
  const DS4_BODY = [[170,193],[168,200],[145,235],[133,259],[124,283],[113,331],[104,357],[95,392],[76,487],[72,539],[72,586],[81,619],[88,633],[95,643],[108,655],[125,664],[138,668],[166,668],[188,658],[202,648],[219,631],[230,615],[255,561],[278,498],[281,494],[290,489],[294,489],[300,495],[315,504],[335,510],[357,510],[366,508],[387,499],[399,489],[435,489],[436,491],[513,491],[514,489],[550,489],[562,499],[583,508],[592,510],[614,510],[634,504],[649,495],[655,489],[659,489],[664,491],[671,498],[694,561],[719,615],[730,631],[752,652],[761,658],[783,668],[811,668],[824,664],[841,655],[854,643],[861,633],[868,619],[877,586],[876,518],[873,487],[854,392],[845,357],[836,331],[821,271],[804,235],[781,200],[780,195],[776,189],[769,188],[768,186],[669,186],[661,188],[657,192],[650,195],[605,195],[602,193],[347,193],[344,195],[299,195],[292,192],[288,188],[280,186],[181,186],[180,188],[173,189]];
  const DS4_TIP = [[73,557],[73,588],[76,602],[86,628],[96,643],[104,651],[118,660],[136,667],[164,668],[187,658],[205,645],[215,635],[228,617],[235,604],[218,612],[197,616],[166,615],[138,609],[116,601],[100,593],[90,586],[80,574]];
  const DS4_L2 = [[210,80],[201,90],[196,100],[189,122],[181,159],[279,159],[275,109],[273,102],[264,86],[255,78],[243,71],[225,72]];
  const mirror = (pts, cx) => pts.map((p) => [2 * cx - p[0], p[1]]);
  const VADER_RB = mirror(VADER_LB, 256);
  const DS4_TIP_R = mirror(DS4_TIP, 475);
  const DS4_R2 = mirror(DS4_L2, 475);

  const ds4Bumper = (left) => {
    const x0 = 184, x1 = 276, cx = (x0 + x1) / 2, half = (x1 - x0) / 2;
    const v = [[x0, 194]];
    for (let i = 0; i <= 16; i++) {
      const x = x0 + ((x1 - x0) * i) / 16, t = (x - cx) / half;
      v.push([x, 166 + 8 * t * t + 6 * t ** 8]);
    }
    v.push([x1, 194]);
    return left ? v : mirror(v, 475);
  };
  const ds4Arrow = (cx, cy, ux, uy) => {
    const TIP = 15, SH = 29, END = 60, HALF = 16, R = 7;
    const uv = [[TIP, 0], [SH, HALF]];
    for (const [cv, a0] of [[HALF - R, 0], [-(HALF - R), 90]]) {
      for (let i = 0; i <= 4; i++) {
        const a = ((a0 + i * 22.5) * Math.PI) / 180;
        uv.push([END - R + R * Math.sin(a), cv + R * Math.cos(a)]);
      }
    }
    uv.push([SH, -HALF]);
    const px = -uy, py = ux;
    return uv.map((p) => [cx + ux * p[0] + px * p[1], cy + uy * p[0] + py * p[1]]);
  };

  // ---- painter in photo space
  let S = 1; // photo px -> css px
  const lw = (w) => Math.max(w * S, 0.8) / S;
  const path = (pts, close = true) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (close) ctx.closePath();
  };
  const fill = (pts, c) => { path(pts); ctx.fillStyle = Array.isArray(c) ? css(c) : c; ctx.fill(); };
  const stroke = (c, w) => { ctx.strokeStyle = css(c); ctx.lineWidth = lw(w); ctx.stroke(); };
  const edgeLine = (pts, c, w) => { path(pts); stroke(c, w); };
  const grad = (y0, y1, top, bot) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, css(top)); g.addColorStop(1, css(bot)); return g; };
  const disc = (x, y, r, c) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = css(c); ctx.fill(); };
  const ring = (x, y, r, c, w) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); stroke(c, w); };
  const rrPath = (x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  const rr = (x, y, w, h, r, c) => { rrPath(x, y, w, h, r); ctx.fillStyle = css(c); ctx.fill(); };
  const rrLine = (x, y, w, h, r, c, l) => { rrPath(x, y, w, h, r); stroke(c, l); };
  const seg = (x1, y1, x2, y2, c, w) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); stroke(c, w); };
  const label = (x, y, t, size, c) => {
    ctx.font = `600 ${size}px Manrope, Arial, sans-serif`;
    ctx.fillStyle = css(c);
    ctx.fillText(t, x, y);
  };
  const rising = (pts, t, c) => {
    if (t <= 0.02) return;
    const ys = pts.map((p) => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const top = y1 - (y1 - y0) * Math.min(t, 1);
    ctx.save();
    path(pts);
    ctx.clip();
    ctx.fillStyle = css(c);
    ctx.fillRect(0, top, 2000, y1 - top + 1);
    ctx.restore();
  };
  const cap = (cx, cy, travel, x, y) => {
    let vx = x, vy = y;
    const len = Math.hypot(vx, vy);
    if (len > 1) { vx /= len; vy /= len; }
    return [cx + vx * travel, cy - vy * travel, len > 0.15];
  };
  const DIRS = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];

  // ---- v4pro (Flydigi Vader 4 Pro)
  function vader(p) {
    const b = (k) => p.b[k];
    const acc = V.pressed, onAcc = on(acc), light = V.light, key = V.buttons, keyEdge = edge(key);

    for (const [x, l, v, fromRight] of [[95, 'LT', p.lt, false], [337, 'RT', p.rt, true]]) {
      rr(x, 42, 80, 13, 6.5, V.triggers);
      rrLine(x, 42, 80, 13, 6.5, edge(V.triggers), 1.5);
      if (v > 0.02) {
        const w = Math.max(80 * v, 13);
        rr(fromRight ? x + 80 - w : x, 42, w, 13, 6.5, alpha(acc, 90 + 165 * v));
      }
      label(x + 40, 49, l, 10, v > 0.5 ? onAcc : lighter(V.triggers, 0.4));
    }

    fill(VADER_BODY, grad(60, 395, V.body, darker(V.body, 0.65)));
    edgeLine(VADER_BODY, lighter(V.body, 0.12), 1.5);
    for (const [o, pr] of [[VADER_LB, b('lb')], [VADER_RB, b('rb')]]) {
      fill(o, pr ? acc : V.bumpers);
      edgeLine(o, edge(V.bumpers), 1.2);
    }

    const ridge = [255, 255, 255, 18];
    seg(214, 213, 256, 186, ridge, 2.5);
    seg(298, 213, 256, 186, ridge, 2.5);
    const lit = b('back') || b('start');
    for (const [w, c] of [[12, alpha(light, 72)], [5, lit ? lighter(light, 0.3) : light], [1.6, lighter(light, 0.55)]]) {
      path([[192, 104], [256, 155], [320, 104]], false);
      stroke(c, w);
    }
    fill([[246, 104], [266, 104], [256, 120]], lighter(V.body, 0.18));

    for (const [[x1, y1, x2, y2], pr] of [[[184, 121, 204, 135], b('back')], [[328, 121, 308, 135], b('start')]]) {
      seg(x1, y1, x2, y2, keyEdge, 15);
      seg(x1, y1, x2, y2, pr ? acc : key, 12);
    }

    const stick = (cx, cy, x, y, click) => {
      disc(cx, cy, 47, darker(V.body, 0.7));
      ring(cx, cy, 47, lighter(V.body, 0.06), 1.5);
      ring(cx, cy, 40, lighter(V.sticks, 0.06), 7);
      ring(cx, cy, 35, darker(V.sticks, 0.2), 1.5);
      const [dx, dy, active] = cap(cx, cy, 12, x, y);
      disc(dx, dy, 23, click ? acc : V.sticks);
      ring(dx, dy, 23, active ? acc : edge(V.sticks), active ? 3 : 1.5);
      ring(dx, dy, 14, lighter(V.sticks, 0.06), 1.5);
    };
    stick(123, 167, p.lx, p.ly, b('ls'));
    stick(320, 252, p.rx, p.ry, b('rs'));

    const [dx, dy] = [191, 245];
    disc(dx, dy, 40, darker(V.dpad, 0.4));
    ring(dx, dy, 40, edge(V.dpad), 1.5);
    for (const [k, ux, uy] of DIRS) {
      const [w, h] = ux ? [36, 27] : [27, 36];
      const x = dx + ux * 22 - w / 2, y = dy + uy * 22 - h / 2;
      rr(x, y, w, h, 4, b(k) ? acc : V.dpad);
      rrLine(x, y, w, h, 4, edge(V.dpad), 1.2);
    }
    rr(dx - 13.5, dy - 13.5, 27, 27, 2, V.dpad);

    for (const [k, l, x, y] of [['y', 'Y', 385, 130], ['x', 'X', 352, 163], ['b', 'B', 418, 163], ['a', 'A', 385, 196]]) {
      const pr = b(k);
      disc(x, y, 15.5, pr ? acc : key);
      ring(x, y, 15.5, keyEdge, 1.5);
      label(x, y + 1, l, 12, pr ? onAcc : V.letters);
    }
    for (const [l, x, y] of [['Z', 437, 225], ['C', 404, 254]]) {
      disc(x, y, 14, key);
      ring(x, y, 14, keyEdge, 1.5);
      label(x, y + 1, l, 11, darker(V.letters, 0.25));
    }
    rr(250, 241, 12, 4, 2, hex(0xe8e8ec));
    rr(251, 256, 10, 2.5, 1.2, hex(0x55555b));
    for (const x of [226, 262]) {
      rr(x, 295, 24, 7, 3.5, key);
      rrLine(x, 295, 24, 7, 3.5, keyEdge, 1);
    }
  }

  // ---- DualShock 4
  function ds4(p) {
    const b = (k) => p.b[k];
    const press = D.pressed, glow = alpha(D.glow, 170), wells = D.wells;

    for (const [o, v, l, x] of [[DS4_L2, p.lt, 'L2', 230], [DS4_R2, p.rt, 'R2', 720]]) {
      fill(o, D.triggers);
      rising(o, v, press);
      label(x, 137, l, 20, v > 0.5 ? on(press) : darker(D.triggers, 0.35));
    }
    for (const [left, pr] of [[true, b('lb')], [false, b('rb')]]) {
      fill(ds4Bumper(left), pr ? press : D.bumpers);
      stroke(pr ? glow : darker(D.bumpers, 0.2), 2);
    }

    fill(DS4_BODY, grad(190, 600, D.body, darker(D.body, 0.08)));
    edgeLine(DS4_BODY, darker(D.body, 0.22), 2);
    fill(DS4_TIP, D.grips);
    fill(DS4_TIP_R, D.grips);

    rr(343, 192, 264, 153, 10, D.touchpad);
    rrLine(343, 192, 264, 153, 10, darker(D.touchpad, 0.2), 2);

    for (const [x, pr, l, c] of [[299, b('back'), 'SHARE', D.share], [624, b('start'), 'OPTIONS', D.options]]) {
      rr(x, 213, 27, 45, 13.5, pr ? press : c);
      rrLine(x, 213, 27, 45, 13.5, pr ? glow : darker(c, 0.2), pr ? 4 : 2);
      label(x + 13.5, 205, l, 11, on(D.body));
    }

    const [dx, dy] = [226, 315];
    disc(dx, dy, 94, wells);
    const k = 8, arrowC = lighter(wells, 0.14);
    fill([[dx, 232 - k], [dx - k, 232 + k * 0.2], [dx + k, 232 + k * 0.2]], arrowC);
    fill([[dx, 398 + k], [dx - k, 398 - k * 0.2], [dx + k, 398 - k * 0.2]], arrowC);
    fill([[143 - k, dy], [143 + k * 0.2, dy - k], [143 + k * 0.2, dy + k]], arrowC);
    fill([[309 + k, dy], [309 - k * 0.2, dy - k], [309 - k * 0.2, dy + k]], arrowC);
    const dip = lighter(wells, 0.06);
    rr(dx - 20, dy - 62, 40, 124, 10, dip);
    rr(dx - 62, dy - 20, 124, 40, 10, dip);
    for (const [key, ux, uy] of DIRS) {
      const pr = b(key);
      fill(ds4Arrow(dx, dy, ux, uy), pr ? press : D.dpad);
      if (pr) stroke(glow, 4);
    }

    disc(724, 315, 94, wells);
    for (const [key, x, y, sym] of [['y', 724, 258, hex(0x3ddc97)], ['x', 667, 315, hex(0xe46cf0)], ['b', 781, 315, hex(0xff6b6b)], ['a', 724, 372, hex(0x7aa7ff)]]) {
      const pr = b(key);
      if (pr) ring(x, y, 31, WHITE, 3);
      disc(x, y, 27, pr ? sym : D.face);
      const c = pr ? hex(0x111111) : sym, w = 3.5;
      if (key === 'y') edgeLine([[x, y - 14], [x + 14, y + 10], [x - 14, y + 10]], c, w);
      else if (key === 'b') ring(x, y, 14, c, w);
      else if (key === 'a') { seg(x - 12, y - 12, x + 12, y + 12, c, w); seg(x - 12, y + 12, x + 12, y - 12, c, w); }
      else rrLine(x - 12, y - 12, 24, 24, 1, c, w);
    }

    const detail = darker(on(D.body), 0.3);
    for (const [y, xs] of [[366, [446, 460, 474, 489, 503]], [376, [453, 467, 482, 496]], [387, [460, 474, 489]]]) {
      for (const x of xs) disc(x, y, 4.3, detail);
    }
    disc(475, 432, 21, wells);
    label(475, 433, 'PS', 13, on(wells));
    rr(436, 485, 78, 7, 3.5, wells);

    const stick = (cx, cy, x, y, click) => {
      disc(cx, cy, 76, [0, 0, 0, 18]);
      disc(cx, cy, 70, D.ring);
      disc(cx, cy, 51, wells);
      const [sx, sy, active] = cap(cx, cy, 18, x, y);
      if (active) ring(cx, cy, 70, glow, 3);
      disc(sx, sy, 46, click ? press : D.sticks);
      disc(sx, sy, 27, click ? darker(press, 0.12) : lighter(D.sticks, 0.1));
    };
    stick(346, 427, p.lx, p.ly, b('ls'));
    stick(603, 427, p.rx, p.ry, b('rs'));
  }

  const SKINS = {
    v4pro: { draw: vader, bounds: [12, 40, 488, 355] },
    ds4: { draw: ds4, bounds: [70, 68, 810, 604] },
  };

  // ---- input (standard mapping)
  const NAMES = ['a', 'b', 'x', 'y', 'lb', 'rb', 'lt', 'rt', 'back', 'start', 'ls', 'rs', 'up', 'down', 'left', 'right'];
  const idle = () => ({ b: {}, lt: 0, rt: 0, lx: 0, ly: 0, rx: 0, ry: 0 });

  function readPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of pads) {
      if (!g || !g.connected) continue;
      const p = idle();
      g.buttons.forEach((btn, i) => { if (NAMES[i]) p.b[NAMES[i]] = btn.pressed; });
      p.lt = g.buttons[6] ? g.buttons[6].value : 0;
      p.rt = g.buttons[7] ? g.buttons[7].value : 0;
      const ax = (i) => { const v = g.axes[i] || 0; return Math.abs(v) < 0.06 ? 0 : v; };
      p.lx = ax(0); p.ly = -ax(1); p.rx = ax(2); p.ry = -ax(3);
      return { pad: p, id: g.id };
    }
    return null;
  }

  // demo: one button after another, the sticks draw slow circles
  const DEMO = ['a', 'b', 'x', 'y', 'rt', 'rb', 'right', 'down', 'left', 'up', 'lt', 'lb', 'start', 'ls', 'rs'];
  function demoPad(t) {
    const p = idle();
    const step = 0.62, i = Math.floor(t / step) % DEMO.length, ph = (t % step) / step;
    const k = DEMO[i];
    if (k === 'lt' || k === 'rt') p[k] = Math.sin(Math.min(ph / 0.8, 1) * Math.PI);
    else p.b[k] = ph < 0.5;
    p.lx = 0.75 * Math.cos(t * 1.4); p.ly = 0.75 * Math.sin(t * 1.4);
    p.rx = 0.6 * Math.sin(t * 0.9); p.ry = 0.6 * Math.sin(t * 1.8);
    return p;
  }

  // ---- loop
  let skin = 'v4pro', userPicked = false, lastId = null, w = 0, h = 0, dpr = 1;
  const setSkin = (s, byUser) => {
    skin = s;
    if (byUser) userPicked = true;
    chips.forEach((c) => {
      c.classList.toggle('active', c.dataset.skin === s);
      c.setAttribute('aria-pressed', String(c.dataset.skin === s));
    });
    if (!running) frame(performance.now(), true);
  };
  chips.forEach((c) => c.addEventListener('click', () => setSkin(c.dataset.skin, true)));

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    if (!running) frame(performance.now(), true);
  }

  function frame(now, once) {
    const live = readPad();
    if (live && live.id !== lastId) {
      lastId = live.id;
      if (!userPicked) setSkin(/054c|dualshock|dualsense|wireless controller|playstation/i.test(live.id) ? 'ds4' : 'v4pro');
      statusEl.textContent = 'подключён · ' + live.id.replace(/\s*\(.*\)\s*$/, '').slice(0, 40);
      statusEl.classList.add('live');
    } else if (!live && lastId !== null) {
      lastId = null;
      statusEl.textContent = DEMO_TEXT;
      statusEl.classList.remove('live');
    }
    const pad = live ? live.pad : demoPad(reduceMotion ? 0 : now / 1000);

    const { draw, bounds: [bx, by, bw, bh] } = SKINS[skin];
    S = Math.min(w / bw, h / bh) * 0.96;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr * S, 0, 0, dpr * S, dpr * ((w - bw * S) / 2 - bx * S), dpr * ((h - bh * S) / 2 - by * S));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    draw(pad);
    if (running && !once) requestAnimationFrame((t) => frame(t));
  }

  let running = false, visible = false;
  const update = () => {
    const want = visible && !document.hidden;
    if (want && !running) { running = true; requestAnimationFrame((t) => frame(t)); }
    if (!want) running = false;
  };
  statusEl.textContent = DEMO_TEXT;
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); }).observe(canvas);
  document.addEventListener('visibilitychange', update);
})();
