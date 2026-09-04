// ── Terminal ──────────────────────────────────────────────
const WORKER_URL = 'https://portfolio-tg.zanxxxxx1.workers.dev';

const terminalInput = document.getElementById('terminal-input');
const terminalLog   = document.getElementById('terminal-log');

function addLogLine(text, type = 'sent') {
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
      body: JSON.stringify({ text, website: '' }),
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

    const result = await sendMessage(msg);
    const replies = {
      ok:    ['  message sent.', 'ok'],
      limit: ['  slow down. try again in a few minutes.', 'err'],
      err:   ['  error. try again later.', 'err'],
    };
    addLogLine(...replies[result]);

    terminalInput.disabled = false;
    terminalInput.focus();
  });
}
// ─────────────────────────────────────────────────────────

// ── Mobile menu ───────────────────────────────────────────
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

// ── Project filters ───────────────────────────────────────
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

// ── Reveal on scroll ──────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
