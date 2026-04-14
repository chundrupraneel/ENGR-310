// ===========================
// NAVIGATION — HAMBURGER TOGGLE
// ===========================
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close menu when a nav link is clicked
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu when clicking outside the nav
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

// ===========================
// NAVIGATION — SCROLL SHADOW
// ===========================
const nav = document.querySelector('nav');
if (nav) {
  const handleScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load
}

// ===========================
// CONTACT FORM — INLINE VALIDATION
// ===========================
const contactForm = document.getElementById('contactForm');
if (contactForm) {

  function validateField(input) {
    const group = input.closest('.form-group');
    if (!group) return true;
    const errEl = group.querySelector('.field-error');
    const value = input.value.trim();
    let valid = true;
    let message = '';

    if (input.required && !value) {
      valid = false;
      message = 'This field is required.';
    } else if (input.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      valid = false;
      message = 'Please enter a valid email address.';
    }

    input.classList.toggle('invalid', !valid);
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.toggle('visible', !valid);
    }
    return valid;
  }

  // Validate on blur for real-time feedback
  contactForm.querySelectorAll('input, textarea, select').forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('invalid')) validateField(field);
    });
  });
}

// ===========================
// SCROLL FADE-IN ANIMATIONS
// ===========================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Unobserve after animating so it doesn't re-trigger
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ===========================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
