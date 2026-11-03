(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- loader: hide after the bar fills and the page has loaded
  const t0 = performance.now();
  const done = () => setTimeout(() => root.classList.add('loaded'), Math.max(0, (reduce ? 0 : 1200) - (performance.now() - t0)));
  if (document.readyState === 'complete') done(); else addEventListener('load', done);
  setTimeout(() => root.classList.add('loaded'), 4000); // never block the page

  // ---------- 8x8 pixel icons
  const PAL = { k: '#1a1416', w: '#f2ece8', s: '#5ee5ea', p: '#c4262e', g: '#1b9a90', y: '#ffd36a', o: '#ff7a1a', d: '#6a5a60', b: '#6b4a3a' };
  const ICONS = {
    pad: ['........', '.kkkkkk.', 'kddddddk', 'dwddddpd', 'wwwddgds', 'dwddddyd', 'dddkkddd', 'dd....dd'],
    chip: ['..s..s..', '.kkkkkk.', 'skggggks', '.kgwwgk.', '.kgwwgk.', 'skggggks', '.kkkkkk.', '..s..s..'],
    inj: ['......ww', '.....ws.', '....sss.', '...sss..', '..sss...', '.ppp....', 'pp......', 'k.......'],
    hook: ['...www..', '..w...w.', '......w.', '.....w..', '....w...', 's...w...', 's..w....', '.ss.....'],
    wrench: ['.yy.....', 'y..y....', 'y..yy...', '.yy.y...', '....yb..', '.....bb.', '......bb', '.......b'],
    chest: ['bbbbbbbb', 'boooooob', 'boooooob', 'bbbyybbb', 'booyyoob', 'boooooob', 'boooooob', 'bbbbbbbb'],
    needle: ['.......w', '......w.', '.....gg.', '....ggg.', '...ggg..', '..ggg...', '.kk.....', 'k.......'],
    plane: ['......ss', '....ssss', '..ssssws', 'sssswss.', '..swss..', '...ss...', '...s....', '........'],
  };
  const icon = (name) => {
    const rows = ICONS[name]; const c = document.createElement('canvas');
    if (!rows) return c;
    c.width = 8; c.height = 8; const g = c.getContext('2d');
    rows.forEach((r, y) => [...r].forEach((ch, x) => { if (PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } }));
    return c;
  };
  $$('[data-icon]').forEach((el) => el.prepend(icon(el.dataset.icon)));

  // ---------- inventory + tooltip
  const slots = $('#slots'); const tip = $('#tooltip');
  if (slots && tip) {
    const cols = getComputedStyle(slots).gridTemplateColumns.split(' ').length || 4;
    const items = $$('.item', slots);
    const total = Math.ceil(items.length / cols) * cols + cols; // one spare row of empty slots
    for (let i = items.length; i < total; i++) {
      const e = document.createElement('div'); e.className = 'item empty'; e.setAttribute('aria-hidden', 'true'); slots.append(e);
    }
    const RAR = { legend: 'Легендарный', epic: 'Эпический', rare: 'Редкий', common: 'Обычный' };
    let sel = null;
    const select = (it) => {
      if (sel === it) return; if (sel) sel.classList.remove('sel'); sel = it; it.classList.add('sel');
      tip.dataset.rarity = it.dataset.rarity;
      $('.tt-name', tip).textContent = it.dataset.name;
      $('.tt-rarity', tip).textContent = `${RAR[it.dataset.rarity] || ''} · ${it.dataset.kind}`;
      $('.tt-desc', tip).textContent = it.dataset.desc;
      $('.tt-tags', tip).textContent = it.dataset.tags;
      $('.tt-open', tip).href = it.href;
      tip.classList.remove('flash'); void tip.offsetWidth; tip.classList.add('flash');
    };
    items.forEach((it) => {
      it.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') select(it); });
      it.addEventListener('focus', () => select(it));
      it.addEventListener('click', (e) => { if (sel !== it) { e.preventDefault(); select(it); } });
    });
    select(items[0]);
  }

  // ---------- hotbar: scroll spy + keys 1..4, T for chat
  const slotsNav = $$('.hotbar .slot');
  const sections = $$('[data-section]');
  const spy = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) slotsNav.forEach((s) => s.classList.toggle('on', s.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));
  const chatInput = $('#chat-input');
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    const s = slotsNav.find((x) => x.dataset.key === e.key);
    if (s) { e.preventDefault(); $(s.getAttribute('href')).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
    if ((e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е') && chatInput) {
      e.preventDefault(); $('#chat').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); setTimeout(() => chatInput.focus({ preventScroll: true }), reduce ? 0 : 450);
    }
  });

  // ---------- XP bar = scroll progress
  const xp = $('.xp-bar i');
  const onScroll = () => { if (xp) xp.style.width = Math.min(100, (scrollY / (document.body.scrollHeight - innerHeight)) * 100) + '%'; };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // ---------- typed words
  const typed = $('.typed');
  if (typed && !reduce) {
    const words = typed.dataset.words.split('|'); let w = 0, n = words[0].length, del = true;
    setTimeout(function tick() {
      const word = words[w];
      if (del) { n--; if (n <= 0) { del = false; w = (w + 1) % words.length; } }
      else { n++; if (n >= words[w].length) { del = true; typed.textContent = words[w]; return setTimeout(tick, 1800); } }
      typed.textContent = words[w].slice(0, Math.max(0, n)) || '​';
      setTimeout(tick, del ? 40 : 70);
    }, 2200);
  }

  // ---------- reveal, counters, achievement toasts
  const countUp = (el) => {
    const end = +el.dataset.count; if (reduce) return;
    let i = 0; const steps = 12; const id = setInterval(() => { i++; el.textContent = Math.round((end * i) / steps); if (i >= steps) clearInterval(id); }, 55);
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    el.classList.add('in', 'show');
    $$('[data-count]', el).forEach((c) => { if (!c.classList.contains('item')) countUp(c); });
  }), { threshold: 0.15 });
  $$('.reveal, .toast').forEach((el) => io.observe(el));

  // ---------- chat -> Telegram via Worker
  const WORKER_URL = 'https://portfolio-tg.zanxxxxx1.workers.dev';
  const log = $('#chat-log'); const honeypot = $('#chat-website');
  const line = (html, cls) => { const p = document.createElement('p'); if (cls) p.className = cls; p.innerHTML = html; log.append(p); log.scrollTop = log.scrollHeight; return p; };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  if (chatInput && log) {
    chatInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Escape') { chatInput.blur(); return; }
      if (e.key !== 'Enter') return;
      const msg = chatInput.value.trim(); if (!msg) return;
      chatInput.value = ''; chatInput.disabled = true;
      line(`<b>&lt;ты&gt;</b> ${esc(msg)}`, 'me');
      const wait = line('<b class="c-gold">[Сервер]</b> отправка...');
      let r = 'err';
      try {
        const res = await fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: msg, website: honeypot ? honeypot.value : '' }) });
        r = res.status === 429 ? 'limit' : res.ok ? 'ok' : 'err';
      } catch { r = 'err'; }
      wait.remove();
      const msgs = { ok: ['сообщение доставлено anx1ous.', 'ok'], limit: ['не так быстро. попробуй через пару минут.', 'err'], err: ['ошибка отправки. попробуй позже или напиши в @anx1ous.', 'err'] };
      line(`<b class="c-gold">[Сервер]</b> ${msgs[r][0]}`, msgs[r][1]);
      chatInput.disabled = false; chatInput.focus();
    });
  }
})();
