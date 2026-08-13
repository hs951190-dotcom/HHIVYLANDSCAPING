/* ==========================================================================
   H&H IVY LANDSCAPING — Site interactions
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Dark mode toggle
     ------------------------------------------------------------------ */
  var themeToggle = document.getElementById('themeToggle');
  var THEME_KEY = 'hh-ivy-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  function storeTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* storage unavailable, ignore */ }
  }

  if (themeToggle) {
    // Theme was already set on <html> by the inline head script to avoid
    // a flash of the wrong theme — just sync the button state to match.
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

    themeToggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      storeTheme(next);
    });
  }

  /* ------------------------------------------------------------------
     Sticky nav shadow on scroll
     ------------------------------------------------------------------ */
  var siteNav = document.getElementById('siteNav');
  function handleNavShadow() {
    if (window.scrollY > 12) {
      siteNav.classList.add('scrolled');
    } else {
      siteNav.classList.remove('scrolled');
    }
  }

  /* ------------------------------------------------------------------
     Mobile menu toggle
     ------------------------------------------------------------------ */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', function () {
    var isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close mobile menu after tapping a link
  Array.prototype.forEach.call(navLinks.querySelectorAll('.nav-link'), function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  /* ------------------------------------------------------------------
     Active section highlighting via IntersectionObserver
     ------------------------------------------------------------------ */
  var sections = document.querySelectorAll('main section[id]');
  var navLinkMap = {};
  Array.prototype.forEach.call(navLinks.querySelectorAll('.nav-link'), function (link) {
    navLinkMap[link.dataset.section] = link;
  });

  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var link = navLinkMap[entry.target.id];
      if (!link) return;
      if (entry.isIntersecting) {
        Array.prototype.forEach.call(navLinks.querySelectorAll('.nav-link'), function (l) {
          l.classList.remove('active');
        });
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(function (section) { sectionObserver.observe(section); });

  /* ------------------------------------------------------------------
     Signature element: growing ivy vine tied to scroll depth
     ------------------------------------------------------------------ */
  var vinePath = document.getElementById('vinePath');
  var vineLength = 0;
  if (vinePath && !reduceMotion) {
    vineLength = vinePath.getTotalLength();
    vinePath.style.strokeDasharray = String(vineLength);
    vinePath.style.strokeDashoffset = String(vineLength);
  }

  function updateVine() {
    if (!vinePath || reduceMotion || !vineLength) return;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0;
    vinePath.style.strokeDashoffset = String(vineLength * (1 - progress));
  }

  /* ------------------------------------------------------------------
     Floating CTA visibility (appears once past the hero)
     ------------------------------------------------------------------ */
  var floatingCta = document.getElementById('floatingCta');
  var heroSection = document.getElementById('home');

  function updateFloatingCta() {
    var heroBottom = heroSection.getBoundingClientRect().bottom;
    if (heroBottom < 0) {
      floatingCta.classList.add('visible');
    } else {
      floatingCta.classList.remove('visible');
    }
  }

  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        handleNavShadow();
        updateVine();
        updateFloatingCta();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });
  handleNavShadow();
  updateVine();
  updateFloatingCta();

  /* ------------------------------------------------------------------
     Blog "read more" expand toggles
     ------------------------------------------------------------------ */
  Array.prototype.forEach.call(document.querySelectorAll('.blog-toggle'), function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-target');
      var target = document.getElementById(targetId);
      if (!target) return;
      var isExpanded = target.classList.toggle('expanded');
      btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      btn.textContent = isExpanded ? 'Read Less' : 'Read More';
    });
  });

  /* ------------------------------------------------------------------
     Quote modal controller
     ------------------------------------------------------------------ */
  var modal = document.getElementById('quoteModal');
  var modalClose = document.getElementById('modalClose');
  var modalFormWrap = document.getElementById('modalFormWrap');
  var modalSuccess = document.getElementById('modalSuccess');
  var modalDoneBtn = document.getElementById('modalDoneBtn');
  var quoteForm = document.getElementById('quoteForm');
  var serviceSelect = document.getElementById('q-service');
  var dateInput = document.getElementById('q-date');
  var lastFocusedEl = null;

  // Prevent picking a date in the past
  (function setMinDate() {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    dateInput.setAttribute('min', yyyy + '-' + mm + '-' + dd);
  })();

  function openModal(triggerEl) {
    lastFocusedEl = document.activeElement;

    // Pre-select service if opened from a service card's micro-CTA
    var presetService = triggerEl && triggerEl.getAttribute('data-service');
    if (presetService) {
      Array.prototype.forEach.call(serviceSelect.options, function (opt) {
        if (opt.value === presetService || opt.text === presetService) {
          serviceSelect.value = opt.value || opt.text;
        }
      });
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus the first field for keyboard users
    window.setTimeout(function () {
      var firstField = document.getElementById('q-name');
      if (firstField) firstField.focus();
    }, 250);
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedEl) lastFocusedEl.focus();

    // Reset to the form view after the close transition finishes
    window.setTimeout(function () {
      modalSuccess.hidden = true;
      modalFormWrap.hidden = false;
      resetForm();
    }, 400);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-open-modal]'), function (trigger) {
    trigger.addEventListener('click', function () { openModal(trigger); });
  });

  modalClose.addEventListener('click', closeModal);
  modalDoneBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
  });

  // Basic focus trap while modal is open
  modal.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !modal.classList.contains('open')) return;
    var focusable = modal.querySelectorAll('button, input, select, textarea, a[href]');
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ------------------------------------------------------------------
     Form validation & submission
     ------------------------------------------------------------------ */
  var fieldMessages = {
    name: 'Please enter your full name.',
    email: 'Please enter a valid email address.',
    phone: 'A phone number is required so we can reach you.',
    city: 'Please select your city or area.',
    service: 'Please select the service you need.',
    date: 'Please choose a preferred date.',
    time: 'Please choose a preferred time.'
  };

  function setFieldError(fieldName, message) {
    var input = document.getElementById('q-' + fieldName);
    var errorEl = document.getElementById('err-' + fieldName);
    var row = input.closest('.form-row');
    row.classList.add('has-error');
    errorEl.textContent = message || '';
  }

  function clearFieldError(fieldName) {
    var input = document.getElementById('q-' + fieldName);
    var errorEl = document.getElementById('err-' + fieldName);
    var row = input.closest('.form-row');
    row.classList.remove('has-error');
    errorEl.textContent = '';
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isValidPhone(value) {
    var digits = value.replace(/\D/g, '');
    return digits.length >= 10;
  }

  function validateForm() {
    var data = {
      name: document.getElementById('q-name').value.trim(),
      email: document.getElementById('q-email').value.trim(),
      phone: document.getElementById('q-phone').value.trim(),
      city: document.getElementById('q-city').value,
      service: document.getElementById('q-service').value,
      description: document.getElementById('q-description').value.trim(),
      date: document.getElementById('q-date').value,
      time: document.getElementById('q-time').value
    };

    var firstInvalidField = null;
    var isValid = true;

    Object.keys(data).forEach(function (key) { clearFieldError(key); });

    if (!data.name) { setFieldError('name', fieldMessages.name); isValid = false; firstInvalidField = firstInvalidField || 'name'; }
    if (!data.email || !isValidEmail(data.email)) { setFieldError('email', fieldMessages.email); isValid = false; firstInvalidField = firstInvalidField || 'email'; }
    if (!data.phone || !isValidPhone(data.phone)) { setFieldError('phone', fieldMessages.phone); isValid = false; firstInvalidField = firstInvalidField || 'phone'; }
    if (!data.city) { setFieldError('city', fieldMessages.city); isValid = false; firstInvalidField = firstInvalidField || 'city'; }
    if (!data.service) { setFieldError('service', fieldMessages.service); isValid = false; firstInvalidField = firstInvalidField || 'service'; }
    // Project description is optional — no validation required
    if (!data.date) { setFieldError('date', fieldMessages.date); isValid = false; firstInvalidField = firstInvalidField || 'date'; }
    if (!data.time) { setFieldError('time', fieldMessages.time); isValid = false; firstInvalidField = firstInvalidField || 'time'; }

    return { isValid: isValid, data: data, firstInvalidField: firstInvalidField };
  }

  // Clear a field's error as soon as the visitor starts fixing it
  ['name', 'email', 'phone', 'city', 'service', 'description', 'date', 'time'].forEach(function (key) {
    var input = document.getElementById('q-' + key);
    input.addEventListener('input', function () { clearFieldError(key); });
    input.addEventListener('change', function () { clearFieldError(key); });
  });

  function resetForm() {
    quoteForm.reset();
    ['name', 'email', 'phone', 'city', 'service', 'description', 'date', 'time'].forEach(clearFieldError);
  }

  quoteForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var result = validateForm();

    if (!result.isValid) {
      var invalidInput = document.getElementById('q-' + result.firstInvalidField);
      if (invalidInput) invalidInput.focus();
      return;
    }

   // Submit form data asynchronously to Web3Forms
    var formData = new FormData(quoteForm);

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    })
    .then(function(response) {
      if (response.ok) {
        var successMessageEl = document.getElementById('successMessage');
        var firstName = result.data.name.split(' ')[0];
        successMessageEl.textContent = 'Thank you, ' + firstName + '!';

        var successCheck = modalSuccess.querySelector('.success-check');
        successCheck.innerHTML = successCheck.innerHTML;

        modalFormWrap.hidden = true;
        modalSuccess.hidden = false;
        var doneBtn = document.getElementById('modalDoneBtn');
        if (doneBtn) doneBtn.focus();
      } else {
        alert('There was an error submitting your request. Please try again.');
      }
    })
    .catch(function(error) {
      alert('Network error. Please try again or call us directly.');
    });
  });

})();
