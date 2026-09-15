document.addEventListener('DOMContentLoaded', () => {
  // 1. Рассеянный ореол вокруг курсора
  const ambientGlow = document.getElementById('ambientGlow');
  if (ambientGlow) {
    window.addEventListener('mousemove', (e) => {
      ambientGlow.style.left = e.clientX + 'px';
      ambientGlow.style.top = e.clientY + 'px';
    });
  }

  // 2. Spotlight-подсветка на карточках проектов
  const cards = document.querySelectorAll('.project-card');
  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  });

  // 3. 3D-Tilt эффект на терминале PROFILE.EXE
  const terminal = document.getElementById('heroTerminal');
  if (terminal && window.innerWidth > 1050) {
    terminal.addEventListener('mousemove', (e) => {
      const rect = terminal.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      terminal.style.transform = `perspective(900px) rotateX(${-y / 24}deg) rotateY(${x / 24}deg) rotate(1.5deg)`;
    });
    terminal.addEventListener('mouseleave', () => {
      terminal.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) rotate(1.5deg)';
    });
  }

  // 4. Интерактивная строка терминала
  const terminalInput = document.getElementById('terminal-input');
  const terminalLog = document.getElementById('terminal-log');
  if (terminalInput && terminalLog) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && terminalInput.value.trim() !== '') {
        const val = terminalInput.value.trim();

        // Отображение введенной команды
        const sent = document.createElement('p');
        sent.className = 'terminal-log-line terminal-log-sent';
        sent.textContent = `> ${val}`;
        terminalLog.appendChild(sent);

        // Ответ системы
        const ok = document.createElement('p');
        ok.className = 'terminal-log-line terminal-log-ok';

        const cmd = val.toLowerCase();
        if (cmd === 'help') {
          ok.textContent = 'Commands: help, projects, github, clear';
        } else if (cmd === 'clear') {
          terminalLog.innerHTML = '';
          terminalInput.value = '';
          return;
        } else if (cmd === 'projects') {
          ok.textContent = 'Navigating to #projects...';
          document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
        } else if (cmd === 'github') {
          ok.textContent = 'Opening github.com/qcountel...';
          window.open('https://github.com/qcountel', '_blank');
        } else {
          ok.textContent = `[OK] cmd "${val}" executed.`;
        }

        terminalLog.appendChild(ok);
        terminalLog.scrollTop = terminalLog.scrollHeight;
        terminalInput.value = '';
      }
    });
  }

  // 5. Фильтрация проектов по категориям
  const filterButtons = document.querySelectorAll('.filter');
  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.dataset.filter;
      cards.forEach((card) => {
        const cats = card.dataset.category || '';
        if (filterVal === 'all' || cats.includes(filterVal)) {
          card.style.display = 'flex';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
          }, 10);
        } else {
          card.style.opacity = '0';
          card.style.transform = 'translateY(12px) scale(0.97)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });

  // 6. Плавное появление элементов при скролле (Scroll Reveal)
  const revealElements = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.08 }
  );
  revealElements.forEach((el) => observer.observe(el));

  // 7. Переключение мобильного меню
  const menuToggle = document.getElementById('menuToggle');
  const siteNav = document.getElementById('site-nav');
  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });
  }
});
