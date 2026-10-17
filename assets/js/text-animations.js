(function () {
  const SELECTOR = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button', 'label',
    'figcaption', 'small', 'strong', 'em', 'li', '.section-tag', '.eyebrow',
    '.plan-kicker', '.score-label', '.hero-metrics span', '.hero-metrics strong',
    '.modality-index', '.footer-address', '.js-split', '[data-text-animation]'
  ].join(',');
  const SKIP = 'script,style,noscript,svg,input,textarea,select,option,[contenteditable="true"],[aria-hidden="true"],[data-text-animation="none"]';
  const instances = new Map();
  let observer = null;
  let refreshTimer = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const slowDevice = Number(navigator.hardwareConcurrency || 8) <= 4;

  function isEligible(element) {
    if (!(element instanceof HTMLElement) || element.closest(SKIP)) return false;
    if (!element.textContent.trim() || element.dataset.typewriterReady === 'true') return false;
    if (element.closest('.preloader')) return false;
    if (element.querySelector('input,textarea,select,[contenteditable="true"],svg')) return false;
    if (element.matches('a,button') && element.querySelector('a,button')) return false;
    if (!element.hasAttribute('data-text-animation') && element.parentElement && element.parentElement.closest(SELECTOR)) return false;
    return true;
  }

  function modeFor(element) {
    const requested = element.getAttribute('data-text-animation');
    if (requested === 'none') return 'none';
    if (requested === 'scrub') return 'scrub';
    if (requested === 'words' || element.matches('.js-split')) return 'words';
    if (requested) return 'reveal';
    if (element.matches('h2')) return 'scrub';
    return 'reveal';
  }

  function timingFor(element, count) {
    let step;
    let maxDuration;
    if (element.matches('h1,h2')) {
      step = 0.043;
      maxDuration = 2.2;
    } else if (element.matches('h3,h4,h5,h6,.section-tag,.eyebrow')) {
      step = 0.03;
      maxDuration = 1.8;
    } else if (element.matches('p')) {
      step = 0.013;
      maxDuration = 2.2;
    } else if (element.matches('a,button')) {
      step = 0.02;
      maxDuration = 1.3;
    } else {
      step = 0.009;
      maxDuration = 1.2;
    }
    if (slowDevice) step *= 0.82;
    step = Math.min(step, maxDuration / Math.max(count, 1));

    const delays = [];
    let elapsed = 0;
    const chars = element.querySelectorAll('.char');
    chars.forEach((char) => {
      delays.push(elapsed);
      const value = char.textContent;
      const punctuation = /[.,!?;:]/.test(value);
      const whitespace = /^\s+$/.test(value);
      elapsed += step * (punctuation ? 2.2 : whitespace ? 0.65 : 1);
    });
    if (elapsed > maxDuration && elapsed > 0) {
      const ratio = maxDuration / elapsed;
      return delays.map((delay) => delay * ratio);
    }
    return delays;
  }

  function addCursor(element) {
    if (!element.matches('h1,h2')) return null;
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.textContent = '|';
    const originalPosition = element.style.position;
    if (window.getComputedStyle(element).position === 'static') element.style.position = 'relative';
    element.appendChild(cursor);
    return { node: cursor, originalPosition };
  }

  function moveCursor(cursor, character, element) {
    if (!cursor || !character) return;
    const charRect = character.getBoundingClientRect();
    const parentRect = element.getBoundingClientRect();
    cursor.node.style.left = `${charRect.right - parentRect.left}px`;
    cursor.node.style.top = `${charRect.top - parentRect.top}px`;
    cursor.node.style.height = `${charRect.height}px`;
    cursor.node.classList.add('is-active');
  }

  function revealOnEntry(element, chars, delays, cursor) {
    window.gsap.set(chars, { opacity: 0 });
    let tween;
    const trigger = window.ScrollTrigger.create({
      trigger: element,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        tween = window.gsap.to(chars, {
          opacity: 1,
          duration: 0.001,
          ease: 'none',
          stagger: (index) => delays[index] || 0,
          overwrite: 'auto',
          onUpdate: function () {
            if (cursor) {
              const index = Math.min(chars.length - 1, Math.floor(this.progress() * chars.length));
              moveCursor(cursor, chars[index], element);
            }
          },
          onComplete: () => cursor && cursor.node.classList.remove('is-active')
        });
      }
    });
    return { trigger, get tween() { return tween; } };
  }

  function revealWithScroll(element, chars, delays, cursor) {
    window.gsap.set(chars, { opacity: 0 });
    let lastProgress = -1;
    const tween = window.gsap.to(chars, {
      opacity: 1,
      duration: 0.001,
      ease: 'none',
      stagger: (index) => delays[index] || 0,
      scrollTrigger: {
        trigger: element,
        start: 'top 86%',
        end: 'bottom 56%',
        scrub: 0.45,
        onUpdate: (self) => {
          if (!cursor || Math.abs(self.progress - lastProgress) < 0.015) return;
          lastProgress = self.progress;
          if (self.progress <= 0 || self.progress >= 0.999) {
            cursor.node.classList.remove('is-active');
            return;
          }
          const index = Math.min(chars.length - 1, Math.floor(self.progress * chars.length));
          moveCursor(cursor, chars[index], element);
        }
      }
    });
    return { tween, trigger: tween.scrollTrigger };
  }

  function revealWordsOnEntry(element, words) {
    window.gsap.set(words, { opacity: 0, y: 16 });
    let tween;
    const trigger = window.ScrollTrigger.create({
      trigger: element,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        tween = window.gsap.to(words, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power3.out',
          stagger: 0.07,
          overwrite: 'auto'
        });
      }
    });
    return { trigger, get tween() { return tween; } };
  }

  function animateElement(element) {
    if (!isEligible(element)) return;
    const mode = modeFor(element);
    element.dataset.typewriterReady = 'true';
    if (mode === 'none') return;

    let split;
    let cursor;
    try {
      split = new window.SplitType(element, { types: 'words, chars', tagName: 'span' });
      split.words.forEach((word) => {
        word.style.display = 'inline-block';
        word.style.whiteSpace = 'nowrap';
      });
      if (mode === 'words') {
        split.words.forEach((word) => { word.style.willChange = 'transform, opacity'; });
      } else {
        split.chars.forEach((char) => { char.style.willChange = 'opacity'; });
      }
      const chars = split.chars;
      if (!chars.length) {
        split.revert();
        delete element.dataset.typewriterReady;
        return;
      }
      const delays = timingFor(element, chars.length);
      cursor = mode === 'words' ? null : addCursor(element);
      const animation = mode === 'words'
        ? revealWordsOnEntry(element, split.words)
        : mode === 'scrub'
          ? revealWithScroll(element, chars, delays, cursor)
          : revealOnEntry(element, chars, delays, cursor);
      instances.set(element, { split, chars, cursor, animation });
    } catch (_) {
      if (cursor) {
        cursor.node.remove();
        element.style.position = cursor.originalPosition;
      }
      if (split) split.revert();
      delete element.dataset.typewriterReady;
    }
  }

  function scan(root) {
    if (!root || reducedMotion.matches || !window.gsap || !window.ScrollTrigger || !window.SplitType) return;
    if (root instanceof HTMLElement && root.matches(SELECTOR)) animateElement(root);
    root.querySelectorAll(SELECTOR).forEach(animateElement);
  }

  function refresh() {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      if (window.ScrollTrigger && !reducedMotion.matches) window.ScrollTrigger.refresh();
    }, 120);
  }

  function destroy() {
    if (observer) observer.disconnect();
    observer = null;
    instances.forEach((instance, element) => {
      if (instance.animation.tween) instance.animation.tween.kill();
      if (instance.animation.trigger) instance.animation.trigger.kill();
      if (instance.cursor) {
        instance.cursor.node.remove();
        element.style.position = instance.cursor.originalPosition;
      }
      instance.split.revert();
      delete element.dataset.typewriterReady;
    });
    instances.clear();
  }

  function watchDynamicContent() {
    if (observer || !document.body) return;
    observer = new MutationObserver((mutations) => {
      let addedContent = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            scan(node);
            addedContent = true;
          }
        });
      });
      if (addedContent) refresh();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    if (reducedMotion.matches || !window.gsap || !window.ScrollTrigger || !window.SplitType) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    scan(document);
    refresh();
    watchDynamicContent();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  }

  function rebuild() {
    destroy();
    init();
  }

  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) destroy();
    else rebuild();
  });
  window.addEventListener('resize', refresh, { passive: true });
  window.TreinnaTextAnimations = { init, scan, destroy, rebuild };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
