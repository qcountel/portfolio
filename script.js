// ── Сообщение в Telegram через Worker ─────────────────────
const WORKER_URL = 'https://portfolio-tg.zanxxxxx1.workers.dev';

const terminalInput = document.getElementById('terminal-input');
const honeypot = document.getElementById('terminal-website');
const terminalLog = document.getElementById('terminal-log');

function addLogLine(text, type = 'sent') {
  if (!terminalLog) return;
  const line = document.createElement('p');
  line.className = `terminal-log-line terminal-log-${type}`;
  line.textContent = text;
  terminalLog.appendChild(line);
  terminalLog.scrollTop = terminalLog.scrollHeight;
}

async function sendMessage(text) {
  try {
    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, website: honeypot ? honeypot.value : '' }),
    });
    if (res.status === 429) return 'limit';
    return res.ok ? 'ok' : 'err';
  } catch {
    return 'err';
  }
}

if (terminalInput) {
  terminalInput.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    const msg = terminalInput.value.trim();
    if (!msg) return;

    terminalInput.value = '';
    terminalInput.disabled = true;
    addLogLine('> ' + msg, 'sent');
    addLogLine('  sending...', 'wait');
    const pending = terminalLog ? terminalLog.lastElementChild : null;

    const result = await sendMessage(msg);
    if (pending) pending.remove();
    const replies = {
      ok: ['  message sent.', 'ok'],
      limit: ['  slow down. try again in a few minutes.', 'err'],
      err: ['  error. try again later.', 'err'],
    };
    addLogLine(...replies[result]);

    terminalInput.disabled = false;
    terminalInput.focus();
  });
}

// ── Мобильное меню ────────────────────────────────────────
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const open = navigation.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
  });
  navigation.addEventListener('click', () => {
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
}

// ── Плавное появление ─────────────────────────────────────
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealElements = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealElements.forEach((el) => el.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  revealElements.forEach((el) => observer.observe(el));
}
