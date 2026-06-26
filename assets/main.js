(() => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const revealTargets = document.querySelectorAll(
    '.section-head, .project, .skill-card, .about-copy, .about-side, .contact-list, .contact-form, .hero-stats'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('in'));
  }

  const navLinks = document.querySelectorAll('.primary-nav a[href^="#"]');
  const sections = Array.from(navLinks)
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    sections.forEach(s => spy.observe(s));
  }

  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim(),
        website: form.website ? form.website.value : '',
      };
      if (!data.name || !data.email || !data.message) {
        if (status) { status.textContent = 'Please fill in your name, email, and message.'; status.className = 'form-status error'; }
        return;
      }
      btn.disabled = true;
      const originalLabel = btn.textContent;
      btn.textContent = 'Sending…';
      if (status) { status.textContent = ''; status.className = 'form-status'; }
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => ({ ok: false, error: 'Unexpected response.' }));
        if (res.ok && json.ok) {
          form.reset();
          if (status) { status.textContent = 'Thanks — your message has been sent. A confirmation is on its way to your inbox.'; status.className = 'form-status success'; }
        } else {
          if (status) { status.textContent = json.error || 'Could not send your message. Please try again or email fawiti@espace.co.ke directly.'; status.className = 'form-status error'; }
        }
      } catch (err) {
        if (status) { status.textContent = 'Network error. Please try again or email fawiti@espace.co.ke directly.'; status.className = 'form-status error'; }
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });
  }

  // CV modal / lightbox
  const cvModal = document.getElementById('cv-modal');
  const cvFrame = cvModal && cvModal.querySelector('.cv-modal__frame');
  if (cvModal && cvFrame) {
    let lastFocused = null;
    const openCv = (e) => {
      if (e) e.preventDefault();
      lastFocused = document.activeElement;
      if (!cvFrame.src) cvFrame.src = cvFrame.dataset.cvSrc;
      cvModal.hidden = false;
      cvModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cv-modal-open');
      // next frame so the transition runs
      requestAnimationFrame(() => cvModal.classList.add('open'));
      const closeBtn = cvModal.querySelector('.cv-modal__close');
      if (closeBtn) closeBtn.focus();
    };
    const closeCv = () => {
      cvModal.classList.remove('open');
      cvModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('cv-modal-open');
      const done = () => {
        cvModal.hidden = true;
        cvModal.removeEventListener('transitionend', done);
      };
      cvModal.addEventListener('transitionend', done);
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    };
    document.querySelectorAll('[data-cv-open]').forEach(el => el.addEventListener('click', openCv));
    cvModal.querySelectorAll('[data-cv-close]').forEach(el => el.addEventListener('click', closeCv));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !cvModal.hidden) closeCv();
    });
  }
})();
