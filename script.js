// ── Сообщение в Telegram через Worker ─────────────────────
const WORKER_URL = 'https://portfolio-tg.zanxxxxx1.workers.dev';

const terminalInput = document.getElementById('terminal-input');
const honeypot = document.getElementById('terminal-website');
const terminalLog = document.getElementById('terminal-log');
const contactForm = document.getElementById('contact-form');
const submitButton = contactForm?.querySelector('[type="submit"]');

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

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = terminalInput.value.trim();
    if (!msg || submitButton.disabled) return;

    terminalInput.disabled = true;
    submitButton.disabled = true;
    terminalLog.replaceChildren();
    addLogLine('Отправляю…', 'wait');
    const pending = terminalLog ? terminalLog.lastElementChild : null;

    const result = await sendMessage(msg);
    if (pending) pending.remove();
    const replies = {
      ok: ['Сообщение отправлено.', 'ok'],
      limit: ['Подожди несколько минут и попробуй снова.', 'err'],
      err: ['Не удалось отправить. Попробуй ещё раз.', 'err'],
    };
    addLogLine(...replies[result]);

    if (result === 'ok') terminalInput.value = '';
    terminalInput.disabled = false;
    submitButton.disabled = false;
    terminalInput.focus();
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
