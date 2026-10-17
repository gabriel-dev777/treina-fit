(function () {
  function setupSplitText() {
    // All page text is split and animated by text-animations.js.
  }

  function setupScrollAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.gsap || !window.ScrollTrigger) {
      showStaticContent();
      return;
    }

    const { gsap } = window;
    gsap.registerPlugin(window.ScrollTrigger);
    const introGallery = document.querySelector('.intro-gallery');
    const introViewport = introGallery && introGallery.querySelector('.intro-gallery-viewport');
    const introTrack = introGallery && introGallery.querySelector('.intro-gallery-track');
    if (introGallery && introViewport && introTrack) {
      const introMotion = gsap.matchMedia();
      const introCards = [...introTrack.children];
      gsap.fromTo(introCards,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: introGallery, start: 'top 78%', once: true }
        }
      );
      introMotion.add('(prefers-reduced-motion: no-preference)', () => {
        introGallery.classList.add('is-pinned');
        const distance = () => Math.max(0, introTrack.scrollWidth - introViewport.clientWidth);
        const tween = gsap.to(introTrack, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: introViewport,
            start: 'top top+=72',
            end: () => `+=${distance()}`,
            pin: introViewport,
            scrub: 0.7,
            invalidateOnRefresh: true,
            anticipatePin: 1
          }
        });
        return () => {
          tween.scrollTrigger && tween.scrollTrigger.kill();
          tween.kill();
          introGallery.classList.remove('is-pinned');
        };
      });
    }
    const gallery = document.querySelector('.structure-gallery');
    if (gallery) {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 981px) and (prefers-reduced-motion: no-preference)', () => {
        const structure = gallery.closest('.structure');
        if (structure) structure.classList.add('is-gallery-pinned');
        const distance = () => Math.max(0, gallery.scrollWidth - window.innerWidth + 40);
        gsap.to(gallery, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: '.structure',
            start: 'top top+=72',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.7,
            invalidateOnRefresh: true,
            anticipatePin: 1
          }
        });
        return () => structure && structure.classList.remove('is-gallery-pinned');
      });
    }
    const revealEls = document.querySelectorAll('.reveal-image, .reveal-card');
    revealEls.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
            once: true
          }
        }
      );
    });

    gsap.to('.hero-video', {
      scale: 1.05,
      duration: 3.2,
      ease: 'sine.out'
    });

    const ctaBg = document.querySelector('.cta-bg');
    if (ctaBg) {
      gsap.to(ctaBg, {
        scale: 1.12,
        duration: 3.5,
        scrollTrigger: {
          trigger: '.cta-section',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    const featureCards = [...document.querySelectorAll('.structure-features li')];
    const cardMotion = gsap.matchMedia();
    cardMotion.add('(prefers-reduced-motion: no-preference)', () => {
      featureCards.forEach((item, index) => {
        item.style.position = 'sticky';
        item.style.top = `${110 + index * 12}px`;
        item.style.zIndex = String(index + 1);
        item.style.background = `linear-gradient(135deg, rgba(23,12,38,${0.96 - index * 0.035}), rgba(16,10,24,.98))`;
        item.style.boxShadow = '0 18px 38px rgba(0,0,0,.24)';
      });
      return () => featureCards.forEach((item) => {
        ['position', 'top', 'zIndex', 'background', 'boxShadow', 'marginBottom'].forEach((property) => {
          item.style[property] = '';
        });
      });
    });

  }

  function setupPreloader() {
    const preloader = document.querySelector('.preloader');
    const preloaderWord = document.querySelector('.preloader-word');
    const preloaderLine = document.querySelector('.preloader-line');

    if (!preloader || !preloaderWord || !preloaderLine) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      preloader.classList.add('hidden');
      return;
    }

    if (!window.gsap) {
      preloader.classList.add('hidden');
      return;
    }

    preloader.classList.add('is-active');

    setTimeout(() => {
      if (window.SplitType) {
        const split = new window.SplitType(preloaderWord, { types: 'chars' });
        const chars = split.chars;
        window.gsap.set(chars, { opacity: 0 });
        window.gsap.to(chars, {
          opacity: 1,
          duration: 0.001,
          stagger: 0.035,
          ease: 'none'
        });
      } else {
        window.gsap.fromTo(preloaderWord, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'none' });
      }

      window.gsap.fromTo(preloaderLine, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power2.inOut' });

      window.setTimeout(() => {
        preloader.classList.add('hidden');
      }, 1200);
    }, 200);
  }

  function setupLenis() {
    if (!window.Lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new window.Lenis({
      lerp: 0.08,
      smoothWheel: true,
      anchors: true
    });

    if (window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
    if (window.gsap) {
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }
  }

  function showStaticContent() {
    document.querySelectorAll('.reveal, .reveal-image, .reveal-card, .hero .eyebrow, .hero .hero-text, .hero .hero-actions, .hero .hero-metrics').forEach((el) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.visibility = 'visible';
    });
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setupSplitText();
        setupScrollAnimations();
        setupPreloader();
        setupLenis();
      });
      return;
    }

    setupSplitText();
    setupScrollAnimations();
    setupPreloader();
    setupLenis();
  }

  init();
})();
