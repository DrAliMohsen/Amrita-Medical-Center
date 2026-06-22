/**
 * AMRITA MEDICAL CENTER — script.js
 * ====================================
 * 1. Sticky header (scrolled state + hero-active state)
 * 2. Mobile menu toggle
 * 3. Mouse-follow 3D tilt card (desktop only)
 * 4. GSAP ScrollTrigger entrance animations
 * 5. Footer year
 * 6. Booking form feedback (client-side UX)
 * 7. Smooth scroll for anchor links
 */

/* ============================================================
   UTILITIES
   ============================================================ */

/** Throttle a function to at most once per `delay` ms */
function throttle(fn, delay) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

/* ============================================================
   1. STICKY HEADER
   ============================================================ */
(function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const hero   = document.getElementById('hero');

  function updateHeader() {
    const scrollY     = window.scrollY;
    const heroBottom  = hero ? hero.offsetHeight - 80 : 0;

    // Scrolled state — apply glass background
    if (scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Hero-active state — white nav text while over dark hero
    if (scrollY < heroBottom) {
      header.classList.add('hero-active');
    } else {
      header.classList.remove('hero-active');
    }
  }

  window.addEventListener('scroll', throttle(updateHeader, 16), { passive: true });
  updateHeader(); // run once on load
})();


/* ============================================================
   2. MOBILE MENU TOGGLE
   ============================================================ */
(function initMobileMenu() {
  const btn  = document.getElementById('menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  function toggleMenu(open) {
    btn.classList.toggle('open', open);
    menu.classList.toggle('open', open);
    menu.setAttribute('aria-hidden', String(!open));
    btn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }

  btn.addEventListener('click', () => {
    const isOpen = menu.classList.contains('open');
    toggleMenu(!isOpen);
  });

  // Close on any link click inside menu
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      toggleMenu(false);
      btn.focus();
    }
  });
})();


/* ============================================================
   3. MOUSE-FOLLOW 3D TILT CARD
   Disabled on touch devices and when prefers-reduced-motion
   ============================================================ */
(function initTiltCard() {
  const card = document.getElementById('tilt-card');
  if (!card) return;

  // Disable on touch devices or if user prefers reduced motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch        = window.matchMedia('(hover: none)').matches;
  if (prefersReduced || isTouch) return;

  const MAX_TILT = 16;   // degrees
  const glowEl   = card.querySelector('.tilt-card__glow');

  let rafId = null;
  let targetRX = 0, targetRY = 0;
  let currentRX = 0, currentRY = 0;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate() {
    currentRX = lerp(currentRX, targetRX, 0.1);
    currentRY = lerp(currentRY, targetRY, 0.1);

    card.style.transform =
      `rotateX(${currentRX.toFixed(2)}deg) rotateY(${currentRY.toFixed(2)}deg) scale3d(1.02,1.02,1.02)`;

    // Glow follows cursor within card
    const gx = 50 + (currentRY / MAX_TILT) * 25;
    const gy = 50 - (currentRX / MAX_TILT) * 25;
    if (glowEl) {
      glowEl.style.setProperty('--glow-x', `${gx.toFixed(1)}%`);
      glowEl.style.setProperty('--glow-y', `${gy.toFixed(1)}%`);
    }

    // Keep animating until nearly settled
    if (Math.abs(currentRX - targetRX) > 0.01 || Math.abs(currentRY - targetRY) > 0.01) {
      rafId = requestAnimationFrame(animate);
    } else {
      rafId = null;
    }
  }

  function onMouseMove(e) {
    const rect   = card.getBoundingClientRect();
    const cx     = rect.left + rect.width  / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = (e.clientX - cx) / (rect.width  / 2); // -1 to 1
    const dy     = (e.clientY - cy) / (rect.height / 2); // -1 to 1

    targetRX = -dy * MAX_TILT;
    targetRY =  dx * MAX_TILT;

    if (!rafId) rafId = requestAnimationFrame(animate);
  }

  function onMouseLeave() {
    targetRX = 0;
    targetRY = 0;
    card.style.transition = 'transform 0.6s cubic-bezier(0.23,1,0.32,1)';
    card.style.transform  = 'rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
    setTimeout(() => { card.style.transition = ''; }, 650);
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // Listen on the whole hero section for a larger interactive zone
  const heroSection = document.getElementById('hero');
  if (heroSection) {
    heroSection.addEventListener('mousemove', throttle(onMouseMove, 16));
    heroSection.addEventListener('mouseleave', onMouseLeave);
  }
})();


/* ============================================================
   4. GSAP SCROLL ANIMATIONS
   ============================================================ */
(function initGSAP() {
  // Wait for GSAP to load (it's deferred)
  function setupGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      setTimeout(setupGSAP, 100);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Fade-up elements (individual, with optional data-delay)
    document.querySelectorAll('.gs-fade-up').forEach(el => {
      const delay = parseFloat(el.dataset.delay) || 0;
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          once: true,
        }
      });
    });

    // Staggered grid items (services, why cards)
    const staggerGroups = {};
    document.querySelectorAll('.gs-stagger').forEach(el => {
      const parent = el.closest('section');
      const key    = parent ? parent.id : 'root';
      if (!staggerGroups[key]) staggerGroups[key] = [];
      staggerGroups[key].push(el);
    });

    Object.values(staggerGroups).forEach(group => {
      gsap.to(group, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: group[0],
          start: 'top 85%',
          once: true,
        }
      });
    });
  }

  // Handle prefers-reduced-motion: just make everything visible immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.gs-fade-up, .gs-stagger').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  setupGSAP();
})();


/* ============================================================
   5. FOOTER COPYRIGHT YEAR
   ============================================================ */
(function setYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();


/* ============================================================
   6. BOOKING FORM — client-side UX feedback
   ============================================================ */
(function initForm() {
  const btn = document.getElementById('submit-btn');
  if (!btn) return;

  btn.addEventListener('click', function () {
    const nameVal     = document.getElementById('name')?.value.trim();
    const phoneVal    = document.getElementById('phone')?.value.trim();
    const specialtyEl = document.getElementById('specialty');
    const specialtyVal = specialtyEl?.value;

    // Simple validation
    if (!nameVal) { shakeAndFocus('name', 'Please enter your full name.'); return; }
    if (!phoneVal) { shakeAndFocus('phone', 'Please enter your phone number.'); return; }

    // Success state
    btn.textContent  = '✓ Request Sent!';
    btn.style.background = 'linear-gradient(135deg, #1a9a6c, #22c78c)';
    btn.disabled     = true;

    // In a real deployment, submit via fetch() to a backend endpoint or form service
    // e.g. Formspree, EmailJS, or your own API.
    console.info('Appointment request ready for submission:', {
      name:      nameVal,
      phone:     phoneVal,
      email:     document.getElementById('email')?.value.trim(),
      specialty: specialtyVal,
      message:   document.getElementById('message')?.value.trim(),
    });

    setTimeout(() => {
      btn.textContent  = 'Request Appointment';
      btn.style.background = '';
      btn.disabled     = false;
      // Optionally clear the form:
      // document.querySelectorAll('.contact-form input, .contact-form select, .contact-form textarea').forEach(el => el.value = '');
    }, 4000);
  });

  function shakeAndFocus(id, message) {
    const el = document.getElementById(id);
    if (!el) return;
    el.focus();
    el.style.borderColor = '#e05858';
    el.style.boxShadow   = '0 0 0 3px rgba(224,88,88,0.2)';
    el.addEventListener('input', () => {
      el.style.borderColor = '';
      el.style.boxShadow   = '';
    }, { once: true });
    console.warn(message); // In production replace with accessible inline error message
  }
})();


/* ============================================================
   7. SMOOTH ANCHOR SCROLL (fallback for older browsers)
   ============================================================ */
(function smoothAnchors() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const headerHeight = document.getElementById('site-header')?.offsetHeight || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();
