/* ═══════════════════════════════════════════
   EOS Web3 Landing — main.js
   Handles:
   • Scroll-reveal (Intersection Observer)
   • Metric counter animation
   • Scroll progress bar
   • Cursor follower dot
   • Logo image → text fallback
═══════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─────────────────────────────────────────
     SCROLL REVEAL via Intersection Observer
  ───────────────────────────────────────── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Once revealed, unobserve to save resources
          revealObserver.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,        // trigger when 12% of element is visible
      rootMargin: '0px 0px -40px 0px',
    }
  );

  // Observe all .reveal elements
  function initReveal() {
    document.querySelectorAll('.reveal').forEach((el, i) => {
      // Stagger delay for sibling elements inside containers
      const parent = el.parentElement;
      const siblings = Array.from(parent.querySelectorAll(':scope > .reveal'));
      const idx = siblings.indexOf(el);
      if (idx > 0) {
        el.style.transitionDelay = `${idx * 0.08}s`;
      }
      revealObserver.observe(el);
    });
  }

  /* ─────────────────────────────────────────
     SCROLL PROGRESS BAR
  ───────────────────────────────────────── */
  function initScrollProgress() {
    const bar = document.getElementById('scrollProgress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      bar.style.width = `${pct}%`;
    }, { passive: true });
  }

  /* ─────────────────────────────────────────
     CURSOR FOLLOWER DOT
  ───────────────────────────────────────── */
  function initCursorFollower() {
    const dot = document.getElementById('cursorDot');
    if (!dot) return;
    // Only on pointer devices (not touch)
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;
    let visible = false;
    let raf;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        dot.style.opacity = '1';
        visible = true;
      }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      visible = false;
    });

    function loop() {
      // Lerp toward mouse position (lag factor)
      dotX += (mouseX - dotX) * 0.22;
      dotY += (mouseY - dotY) * 0.22;
      dot.style.left = `${dotX}px`;
      dot.style.top  = `${dotY}px`;
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
  }

  /* ─────────────────────────────────────────
     METRIC COUNTER ANIMATION
     Counts up from 0 → target when the
     metrics section enters the viewport.
  ───────────────────────────────────────── */
  function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    const ease = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease-in-out quad

    function animateCounter(el) {
      const target   = parseFloat(el.dataset.count);
      const prefix   = el.dataset.prefix  || '';
      const suffix   = el.dataset.suffix  || '';
      const divisor  = parseFloat(el.dataset.divisor)  || 1;
      const decimals = parseInt(el.dataset.decimals, 10) || 0;
      const duration = 1800; // ms
      const start    = performance.now();

      function frame(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value    = ease(progress) * target;
        const display  = divisor !== 1
          ? Math.floor(value / divisor)
          : decimals > 0
            ? value.toFixed(decimals)
            : Math.floor(value);
        el.textContent = `${prefix}${display}${suffix}`;
        if (progress < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ─────────────────────────────────────────
     NAV DROPDOWNS
     Click to toggle; close on outside click
     or Escape key.
  ───────────────────────────────────────── */
  function initNavDropdowns() {
    const items = document.querySelectorAll('.nav-item');
    if (!items.length) return;

    function closeAll(except) {
      items.forEach((item) => {
        if (item !== except) {
          item.classList.remove('open');
          const btn = item.querySelector('.nav-link');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    items.forEach((item) => {
      const btn = item.querySelector('.nav-link');
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = item.classList.contains('open');
        closeAll(null);
        if (!isOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Close when clicking outside
    document.addEventListener('click', () => closeAll(null));

    // Close with Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAll(null);
    });
  }

  /* ─────────────────────────────────────────
     HERO VIDEO — ensure autoplay
     (some browsers block autoplay without
      user interaction; keep muted as fallback)
  ───────────────────────────────────────── */
  function initVideo() {
    const video = document.querySelector('.hero__video');
    if (!video) return;
    video.muted = true; // ensure muted attribute is set programmatically
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay was prevented — video stays on poster/first frame
        // This is fine; the overlay and content still display correctly
      });
    }
  }

  /* ─────────────────────────────────────────
     NAVBAR LOGO FALLBACK
     (if the img fails to load, show text)
  ───────────────────────────────────────── */
  function initLogoFallback() {
    document.querySelectorAll('.navbar__logo, .footer__logo').forEach((img) => {
      img.addEventListener('error', () => {
        img.style.display = 'none';
        const fallback = img.nextElementSibling;
        if (fallback) fallback.style.display = 'block';
      });
    });
  }

  /* ─────────────────────────────────────────
     PILL BUTTON — micro ripple effect
  ───────────────────────────────────────── */
  function initPillButtons() {
    document.querySelectorAll('.pill-btn').forEach((btn) => {
      btn.addEventListener('mouseenter', (e) => {
        const glow = btn.querySelector('.pill-btn__glow');
        if (!glow) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const pct = Math.round((x / rect.width) * 100);
        glow.style.left = `${pct}%`;
        glow.style.transform = 'translateX(-50%)';
      });
      btn.addEventListener('mouseleave', () => {
        const glow = btn.querySelector('.pill-btn__glow');
        if (!glow) return;
        // Smooth return to center
        glow.style.left = '50%';
      });
    });
  }

  /* ─────────────────────────────────────────
     FEATURES CARDS — subtle mouse-tracking
     tilt (very light, 4° max)
  ───────────────────────────────────────── */
  function initCardTilt() {
    const MAX_TILT = 4;
    document.querySelectorAll('.glass-card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);
        const tiltX = (-dy * MAX_TILT).toFixed(2);
        const tiltY = (dx * MAX_TILT).toFixed(2);
        card.style.transform = `translateY(-4px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        card.style.transition = 'transform 0.08s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.3s ease, box-shadow 0.3s ease';
      });
    });
  }

  /* ─────────────────────────────────────────
     TICKER — pause on hover
  ───────────────────────────────────────── */
  function initTicker() {
    const track = document.querySelector('.ticker__track');
    if (!track) return;
    track.addEventListener('mouseenter', () => {
      track.style.animationPlayState = 'paused';
    });
    track.addEventListener('mouseleave', () => {
      track.style.animationPlayState = 'running';
    });
  }

  /* ─────────────────────────────────────────
     INIT
  ───────────────────────────────────────── */
  function init() {
    initNavDropdowns();
    initReveal();
    initVideo();
    initLogoFallback();
    initPillButtons();
    initCardTilt();
    initTicker();
    initScrollProgress();
    initCursorFollower();
    initCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
