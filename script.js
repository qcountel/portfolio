// ── 1. Новые визуальные эффекты ───────────────────────────

// Рассеянный свет за курсором
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ambientGlow = document.getElementById('ambientGlow');
if (ambientGlow) {
  let frame = 0;
  let mx = 0;
  let my = 0;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      ambientGlow.style.left = `${mx}px`;
      ambientGlow.style.top = `${my}px`;
      frame = 0;
    });
  }, { passive: true });
}

// Spotlight-подсветка на карточках проектов вслед за мышью
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  });
});

// 3D-Tilt эффект для окна терминала (только на десктопе)
const terminalWindow = document.getElementById('heroTerminal');
if (terminalWindow && !reduceMotion) {
  terminalWindow.addEventListener('mousemove', (e) => {
    if (window.innerWidth <= 1050) return;
    const rect = terminalWindow.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    terminalWindow.style.transform = `perspective(900px) rotateX(${-y / 24}deg) rotateY(${x / 24}deg) rotate(1.5deg)`;
  });

  terminalWindow.addEventListener('mouseleave', () => {
    terminalWindow.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) rotate(1.5deg)';
  });
}

// ── 2. Terminal & Отправка в Telegram Worker ──────────────
const WORKER_URL = 'https://portfolio-tg.zanxxxxx1.workers.dev';

const terminalInput = document.getElementById('terminal-input');
const honeypot      = document.getElementById('terminal-website');
const terminalLog   = document.getElementById('terminal-log');

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
      ok:    ['  message sent.', 'ok'],
      limit: ['  slow down. try again in a few minutes.', 'err'],
      err:   ['  error. try again later.', 'err'],
    };
    addLogLine(...replies[result]);

    terminalInput.disabled = false;
    terminalInput.focus();
  });
}

// ── 3. Мобильное меню ─────────────────────────────────────
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

// ── 4. Фильтры проектов ───────────────────────────────────
const filterButtons = document.querySelectorAll('.filter');
const projects = document.querySelectorAll('.project-card');

// Счётчики в фильтрах считаются по карточкам, чтобы не расходились с реальностью
filterButtons.forEach((button) => {
  const filter = button.dataset.filter;
  const count = filter === 'all'
    ? projects.length
    : [...projects].filter((p) => p.dataset.category.split(' ').includes(filter)).length;
  const sup = button.querySelector('sup');
  if (sup) sup.textContent = String(count).padStart(2, '0');
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => {
      item.classList.remove('active');
      item.setAttribute('aria-pressed', 'false');
    });
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');

    projects.forEach((project) => {
      const categories = project.dataset.category.split(' ');
      project.classList.toggle('hidden', filter !== 'all' && !categories.includes(filter));
    });
  });
});

// ── 5. Scroll Reveal (Плавное появление) ──────────────────
const revealElements = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealElements.forEach((element) => element.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  revealElements.forEach((element) => observer.observe(element));
}
