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

  // CV modal / lightbox — render the PDF with PDF.js so it works on
  // mobile too (iOS Safari & many mobile browsers won't show a PDF in an iframe)
  const cvModal = document.getElementById('cv-modal');
  const cvPages = cvModal && cvModal.querySelector('.cv-modal__frame');
  if (cvModal && cvPages) {
    const CV_PDF = cvPages.dataset.cvSrc || 'assets/documents/fred-awiti-cv.pdf';
    const PDFJS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    let lastFocused = null;
    let pdfState = 'idle'; // idle | loading | done

    const loadScript = (src) => new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });

    const renderCv = async () => {
      if (pdfState === 'done' || pdfState === 'loading') return;
      pdfState = 'loading';
      cvPages.innerHTML = '<p class="cv-note">Loading CV…</p>';
      try {
        if (!window.pdfjsLib) {
          await loadScript(PDFJS_SRC);
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        }
        const pdf = await window.pdfjsLib.getDocument(CV_PDF).promise;
        cvPages.innerHTML = '';
        const small = window.matchMedia('(max-width: 700px)').matches;
        const renderScale = small ? 1 : Math.min(window.devicePixelRatio || 1, 2);
        // Lazily render each page as it scrolls near view (keeps memory sane on phones)
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const wrap = entry.target;
            io.unobserve(wrap);
            pdf.getPage(Number(wrap.dataset.page)).then((page) => {
              const avail = cvPages.clientWidth - 24;
              const base = page.getViewport({ scale: 1 });
              const vp = page.getViewport({ scale: (avail / base.width) * renderScale });
              const canvas = document.createElement('canvas');
              canvas.width = vp.width; canvas.height = vp.height;
              canvas.style.width = '100%'; canvas.style.display = 'block';
              page.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
              wrap.replaceChildren(canvas);
            });
          });
        }, { root: cvPages, rootMargin: '800px 0px' });
        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const wrap = document.createElement('div');
          wrap.className = 'cv-page';
          wrap.dataset.page = String(n);
          wrap.style.aspectRatio = base.width + ' / ' + base.height;
          cvPages.appendChild(wrap);
          io.observe(wrap);
        }
        pdfState = 'done';
      } catch (err) {
        pdfState = 'idle';
        cvPages.innerHTML = '<p class="cv-note">Couldn’t display the CV here. <a href="' + CV_PDF + '" target="_blank" rel="noopener">Open the PDF →</a></p>';
      }
    };

    const openCv = (e) => {
      if (e) e.preventDefault();
      lastFocused = document.activeElement;
      cvModal.hidden = false;
      cvModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('cv-modal-open');
      // next frame so the transition runs and the container has a measurable width
      requestAnimationFrame(() => { cvModal.classList.add('open'); renderCv(); });
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
