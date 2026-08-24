// ── Terminal ──────────────────────────────────────────────
const BOT_TOKEN = '8473093299:AAHzRrwYPHBEQ50XCtM4YEdmfpbZGkTsU1s';
const CHAT_ID   = '1264821926';

const terminalInput = document.getElementById('terminal-input');
const terminalLog   = document.getElementById('terminal-log');

function addLogLine(text, type = 'sent') {
  const line = document.createElement('p');
  line.className = `terminal-log-line terminal-log-${type}`;
  line.textContent = text;
  terminalLog.appendChild(line);
  terminalLog.scrollTop = terminalLog.scrollHeight;
}

async function sendToTelegram(message) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const visitor = navigator.userAgent.slice(0, 60);
  const text = `💬 portfolio message\n\n${message}\n\n📍 ${document.referrer || location.href}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text })
    });
    return res.ok;
  } catch {
    return false;
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

    const ok = await sendToTelegram(msg);

    addLogLine(ok ? '  message sent.' : '  error. try again later.', ok ? 'ok' : 'err');
    terminalInput.disabled = false;
    terminalInput.focus();
  });
}
// ─────────────────────────────────────────────────────────

const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');

menuButton.addEventListener('click', () => {
  const open = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

navigation.addEventListener('click', () => {
  navigation.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
});

const filterButtons = document.querySelectorAll('.filter');
const projects = document.querySelectorAll('.project-card');

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');

    projects.forEach((project) => {
      const categories = project.dataset.category.split(' ');
      project.classList.toggle('hidden', filter !== 'all' && !categories.includes(filter));
    });
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
