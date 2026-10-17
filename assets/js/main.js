const initializeTreinnaPage = () => {
  const header = document.querySelector('.site-header');
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  const navLinks = document.querySelectorAll('.site-nav a');
  const yearTarget = document.getElementById('year');
  const backToTop = document.querySelector('.back-to-top');
  const cursor = document.querySelector('.custom-cursor');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const interactiveEls = document.querySelectorAll('a, button, .modality-card, .faq-item');

  const setActiveSection = () => {
    const sections = [...document.querySelectorAll('main section[id]')];
    const scrollPosition = window.scrollY + 150;

    let currentId = 'top';
    sections.forEach((section) => {
      if (section.offsetTop <= scrollPosition) currentId = section.id;
    });

    navLinks.forEach((link) => {
      const isActive = link.getAttribute('href') === `#${currentId}`;
      link.classList.toggle('active', isActive);
    });
  };

  const handleHeader = () => {
    if (!header) return;
    if (window.scrollY > 24) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  const closeMobileMenu = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    nav.setAttribute('aria-hidden', 'true');
    navToggle.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menu');
    document.body.classList.remove('menu-open');
    navToggle.focus();
  };

  const openMobileMenu = () => {
    if (!nav || !navToggle) return;
    nav.classList.add('is-open');
    nav.setAttribute('aria-hidden', 'false');
    navToggle.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    navToggle.setAttribute('aria-label', 'Fechar menu');
    document.body.classList.add('menu-open');
    nav.querySelector('a[href]')?.focus();
  };

  if (yearTarget) {
    yearTarget.textContent = new Date().getFullYear();
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('is-open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 980) closeMobileMenu();
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMobileMenu();
      if (event.key === 'Tab' && nav.classList.contains('is-open')) {
        const focusable = [...nav.querySelectorAll('a[href]')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) {
        nav.classList.remove('is-open');
        nav.setAttribute('aria-hidden', 'false');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.setAttribute('aria-label', 'Abrir menu');
        document.body.classList.remove('menu-open');
      }
    }, { passive: true });
  }

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  window.addEventListener('scroll', () => {
    handleHeader();
    setActiveSection();
  }, { passive: true });

  handleHeader();
  setActiveSection();

  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const button = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (!button || !answer) return;

    answer.id ||= `faq-answer-${[...faqItems].indexOf(item) + 1}`;
    button.setAttribute('aria-controls', answer.id);
    const initiallyOpen = item.classList.contains('is-open');
    answer.setAttribute('aria-hidden', String(!initiallyOpen));
    answer.inert = !initiallyOpen;

    button.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      faqItems.forEach((faq) => {
        faq.classList.remove('is-open');
        const faqButton = faq.querySelector('.faq-question');
        if (faqButton) faqButton.setAttribute('aria-expanded', 'false');
        const faqAnswer = faq.querySelector('.faq-answer');
        if (faqAnswer) {
          faqAnswer.setAttribute('aria-hidden', 'true');
          faqAnswer.inert = true;
        }
      });

      if (!isOpen) {
        item.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
        answer.setAttribute('aria-hidden', 'false');
        answer.inert = false;
      }
    });
  });

  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches && cursor) {
    cursor.classList.add('is-visible');

    document.addEventListener('pointermove', (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });

    interactiveEls.forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hovering'));
    });
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.marquee-track').forEach((track) => {
      track.style.animation = 'none';
    });
  }

  document.querySelectorAll('.hero-actions a, .nav-cta, .button').forEach((button) => {
    button.addEventListener('focus', () => {
      if (cursor) cursor.classList.add('is-hovering');
    });
    button.addEventListener('blur', () => {
      if (cursor) cursor.classList.remove('is-hovering');
    });
  });

  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.modality-card, .plan-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
        card.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
      }, { passive: true });
    });

    document.querySelectorAll('.button-primary').forEach((button) => {
      let resetTimer;
      button.addEventListener('pointermove', (event) => {
        const bounds = button.getBoundingClientRect();
        const x = event.clientX - bounds.left - bounds.width / 2;
        const y = event.clientY - bounds.top - bounds.height / 2;
        button.style.transform = `translate3d(${Math.max(-5, Math.min(5, x * .08))}px, ${Math.max(-4, Math.min(4, y * .12))}px, 0)`;
      }, { passive: true });
      button.addEventListener('pointerleave', () => {
        window.clearTimeout(resetTimer);
        button.style.transition = 'transform .55s cubic-bezier(.2,1.8,.4,1), box-shadow .3s ease';
        button.style.transform = '';
        resetTimer = window.setTimeout(() => { button.style.transition = ''; }, 560);
      });
    });
  }

  document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
    const url = new URL(link.href);
    if (!url.searchParams.has('text')) {
      url.searchParams.set('text', window.treinnaConfig?.startMessage || 'Olá! Gostaria de conhecer a Treinna Fit.');
      link.href = url.toString();
    }
  });

  if (window.gsap && window.ScrollTrigger) {
    document.querySelectorAll('.marquee-wrap').forEach((wrap) => {
      const track = wrap.querySelector('.marquee-track');
      if (!track) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        track.style.animation = 'none';
      }
    });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTreinnaPage, { once: true });
} else {
  initializeTreinnaPage();
}
