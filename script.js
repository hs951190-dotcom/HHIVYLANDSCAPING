/* ==========================================================================
   H&H IVY LANDSCAPING — Site Interactions, Cloud Gallery & Admin Portal
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     1. Dark Mode Toggle
     ------------------------------------------------------------------ */
  var themeToggle = document.getElementById('themeToggle');
  var THEME_KEY = 'hh-ivy-theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeToggle) themeToggle.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  function storeTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }

  if (themeToggle) {
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
    themeToggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      storeTheme(next);
    });
  }

  /* ------------------------------------------------------------------
     2. Sticky Nav & Mobile Menu
     ------------------------------------------------------------------ */
  var siteNav = document.getElementById('siteNav');
  function handleNavShadow() {
    if (window.scrollY > 12) {
      siteNav.classList.add('scrolled');
    } else {
      siteNav.classList.remove('scrolled');
    }
  }

  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    Array.prototype.forEach.call(navLinks.querySelectorAll('.nav-link'), function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ------------------------------------------------------------------
     3. Active Section Spy & Ivy Vine Scroll
     ------------------------------------------------------------------ */
  var sections = document.querySelectorAll('main section[id]');
  var navLinkMap = {};
  if (navLinks) {
    Array.prototype.forEach.call(navLinks.querySelectorAll('.nav-link'), function (link) {
      navLinkMap[link.dataset.section] = link;
    });
  }

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

  var floatingCta = document.getElementById('floatingCta');
  var heroSection = document.getElementById('home');

  function updateFloatingCta() {
    if (!heroSection || !floatingCta) return;
    var heroBottom = heroSection.getBoundingClientRect().bottom;
    if (heroBottom < 0) {
      floatingCta.classList.add('visible');
    } else {
      floatingCta.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', function () {
    window.requestAnimationFrame(function () {
      handleNavShadow();
      updateVine();
      updateFloatingCta();
    });
  });

  /* ------------------------------------------------------------------
     4. Supabase Client Configuration & Live Gallery
     ------------------------------------------------------------------ */
  var SUPABASE_URL = 'https://euogfaqjnwangdwugofa.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_RhZkeCtOfGAaKD-QJZVaxQ_6l5PAfgw';
  var supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

  var galleryGrid = document.getElementById('galleryGrid');

  async function fetchLiveProjects() {
    if (!galleryGrid) return;
    if (!supabase) {
      galleryGrid.innerHTML = '<p style="color:var(--ink-soft); grid-column:1/-1; text-align:center;">Database loading...</p>';
      return;
    }

    galleryGrid.innerHTML = '<p style="color:var(--ink-soft); grid-column:1/-1; text-align:center;">Loading latest projects...</p>';

    var response = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (response.error || !response.data || response.data.length === 0) {
      galleryGrid.innerHTML = '<p style="color:var(--ink-soft); grid-column:1/-1; text-align:center;">No projects published yet.</p>';
      return;
    }

    galleryGrid.innerHTML = '';
    response.data.forEach(function (proj) {
      var card = document.createElement('article');
      card.className = 'project-card reveal-init';
      card.innerHTML = 
        '<div class="project-card-thumb">' +
          '<img src="' + proj.after_img + '" alt="' + proj.title + '" loading="lazy">' +
          '<div class="project-badge-split"><span>Before</span> / <span>After</span></div>' +
        '</div>' +
        '<div class="project-card-info">' +
          '<span class="project-tag">' + proj.category + '</span>' +
          '<h3>' + proj.title + '</h3>' +
          '<span class="project-view-cta">Interactive Slider &rarr;</span>' +
        '</div>';

      card.addEventListener('click', function () {
        openSliderModal({
          title: proj.title,
          category: proj.category,
          before: proj.before_img,
          after: proj.after_img
        });
      });

      galleryGrid.appendChild(card);
    });

    setTimeout(function() {
      document.querySelectorAll('.project-card').forEach(function(el) {
        el.classList.add('reveal-visible');
      });
    }, 50);
  }

  fetchLiveProjects();

  /* ------------------------------------------------------------------
     5. Helper: Upload Image to Supabase Cloud Storage
     ------------------------------------------------------------------ */
  async function uploadToCloudStorage(file) {
    if (!supabase) throw new Error('Supabase client not initialized');
    var fileExt = file.name.split('.').pop();
    var fileName = Date.now() + '-' + Math.random().toString(36).substring(2) + '.' + fileExt;
    var filePath = 'uploads/' + fileName;

    var uploadRes = await supabase.storage
      .from('project-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadRes.error) throw uploadRes.error;

    var publicUrlRes = supabase.storage
      .from('project-images')
      .getPublicUrl(filePath);

    return publicUrlRes.data.publicUrl;
  }

  /* ------------------------------------------------------------------
     6. Comparison Slider Engine & Modal
     ------------------------------------------------------------------ */
  var sliderModal = document.getElementById('sliderModal');
  var sliderModalClose = document.getElementById('sliderModalClose');
  var compImgAfter = document.getElementById('compImgAfter');
  var compImgBefore = document.getElementById('compImgBefore');
  var compBeforeWrapper = document.getElementById('compBeforeWrapper');
  var compHandle = document.getElementById('compHandle');
  var compContainer = document.getElementById('comparisonContainer');
  var sliderProjectTitle = document.getElementById('sliderProjectTitle');
  var sliderProjectCategory = document.getElementById('sliderProjectCategory');

  function syncBeforeImageDimensions() {
    if (compContainer && compImgBefore) {
      compImgBefore.style.width = compContainer.offsetWidth + 'px';
    }
  }

  function setSliderPosition(percentage) {
    var p = Math.max(0, Math.min(100, percentage));
    compBeforeWrapper.style.width = p + '%';
    compHandle.style.left = p + '%';
  }

  function openSliderModal(proj) {
    sliderProjectTitle.textContent = proj.title;
    sliderProjectCategory.textContent = proj.category;
    compImgBefore.src = proj.before;
    compImgAfter.src = proj.after;

    sliderModal.classList.add('open');
    sliderModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    window.requestAnimationFrame(function () {
      syncBeforeImageDimensions();
      setSliderPosition(50);
    });
  }

  function closeSliderModal() {
    sliderModal.classList.remove('open');
    sliderModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (sliderModalClose) sliderModalClose.addEventListener('click', closeSliderModal);
  if (sliderModal) {
    sliderModal.addEventListener('click', function (e) {
      if (e.target === sliderModal) closeSliderModal();
    });
  }

  var isSliding = false;
  function handleSliderMove(e) {
    if (!isSliding || !compContainer) return;
    var rect = compContainer.getBoundingClientRect();
    var clientX = e.clientX || (e.touches && e.touches[0].clientX);
    if (clientX === undefined) return;
    var position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(position);
  }

  if (compContainer) {
    compContainer.addEventListener('mousedown', function (e) { isSliding = true; handleSliderMove(e); });
    compContainer.addEventListener('touchstart', function (e) { isSliding = true; handleSliderMove(e); }, { passive: true });
  }

  window.addEventListener('mousemove', handleSliderMove);
  window.addEventListener('touchmove', handleSliderMove, { passive: true });
  window.addEventListener('mouseup', function () { isSliding = false; });
  window.addEventListener('touchend', function () { isSliding = false; });
  window.addEventListener('resize', syncBeforeImageDimensions);

  /* ------------------------------------------------------------------
     7. Client Admin Portal (Authenticated Supabase Access)
     ------------------------------------------------------------------ */
  var adminModal = document.getElementById('adminModal');
  var openAdminBtn = document.getElementById('openAdminBtn');
  var footerAdminLink = document.getElementById('footerAdminLink');
  var adminModalClose = document.getElementById('adminModalClose');
  var adminLoginForm = document.getElementById('adminLoginForm');
  var adminLoginView = document.getElementById('adminLoginView');
  var adminDashboardView = document.getElementById('adminDashboardView');
  var adminLoginErr = document.getElementById('adminLoginErr');
  var adminLogoutBtn = document.getElementById('adminLogoutBtn');
  var addProjectForm = document.getElementById('addProjectForm');
  var adminProjectsListWrap = document.getElementById('adminProjectsListWrap');
  var publishProjBtn = document.getElementById('publishProjBtn');

  function openAdminModal() {
    adminModal.classList.add('open');
    adminModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeAdminModal() {
    adminModal.classList.remove('open');
    adminModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (openAdminBtn) openAdminBtn.addEventListener('click', openAdminModal);
  if (footerAdminLink) footerAdminLink.addEventListener('click', function(e) { e.preventDefault(); openAdminModal(); });
  if (adminModalClose) adminModalClose.addEventListener('click', closeAdminModal);
  if (adminModal) {
    adminModal.addEventListener('click', function(e) { if (e.target === adminModal) closeAdminModal(); });
  }

  // Handle Authenticated Admin Login
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var email = "landscape.hhivy@gmail.com";
      var password = document.getElementById('adminPass').value;

      var loginBtn = adminLoginForm.querySelector('button[type="submit"]');
      loginBtn.disabled = true;
      loginBtn.textContent = 'Verifying...';

      var authRes = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      loginBtn.disabled = false;
      loginBtn.textContent = 'Log In';

      if (authRes.error) {
        adminLoginErr.textContent = 'Invalid credentials. Access denied.';
      } else {
        adminLoginErr.textContent = '';
        adminLoginView.hidden = true;
        adminDashboardView.hidden = false;
        renderAdminProjectList();
      }
    });
  }

  // Handle Admin Logout
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', async function () {
      await supabase.auth.signOut();
      adminDashboardView.hidden = true;
      adminLoginView.hidden = false;
      adminLoginForm.reset();
    });
  }

  // Render Admin Project Management List
  async function renderAdminProjectList() {
    if (!adminProjectsListWrap) return;
    adminProjectsListWrap.innerHTML = '<p style="font-size:13px; color:var(--ink-soft);">Loading records...</p>';

    var res = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (res.error || !res.data) return;

    adminProjectsListWrap.innerHTML = '';
    res.data.forEach(function (proj) {
      var item = document.createElement('div');
      item.className = 'admin-item-row';
      item.innerHTML = 
        '<div class="admin-item-info">' +
          '<img src="' + proj.after_img + '" class="admin-item-thumb" alt="">' +
          '<div><strong>' + proj.title + '</strong><br><small style="color:var(--ink-soft);">' + proj.category + '</small></div>' +
        '</div>' +
        '<button class="admin-delete-btn" data-id="' + proj.id + '">Delete</button>';

      item.querySelector('.admin-delete-btn').addEventListener('click', async function () {
        if (!confirm('Delete this project permanently from the live website?')) return;
        
        var delBtn = item.querySelector('.admin-delete-btn');
        delBtn.textContent = 'Deleting...';
        delBtn.disabled = true;

        var delRes = await supabase.from('projects').delete().eq('id', proj.id);
        if (!delRes.error) {
          renderAdminProjectList();
          fetchLiveProjects();
        } else {
          alert('Delete failed. Please check database permissions.');
          delBtn.textContent = 'Delete';
          delBtn.disabled = false;
        }
      });

      adminProjectsListWrap.appendChild(item);
    });
  }

  // Secure Add Project Action
  if (addProjectForm) {
    addProjectForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var title = document.getElementById('projTitle').value.trim();
      var category = document.getElementById('projCategory').value;
      var beforeFile = document.getElementById('projBeforeImg').files[0];
      var afterFile = document.getElementById('projAfterImg').files[0];

      if (!beforeFile || !afterFile) {
        alert('Please select both Before and After photos.');
        return;
      }

      publishProjBtn.disabled = true;
      publishProjBtn.textContent = 'Uploading to Cloud...';

      try {
        var beforeUrl = await uploadToCloudStorage(beforeFile);
        var afterUrl = await uploadToCloudStorage(afterFile);

        var insertRes = await supabase.from('projects').insert([
          {
            title: title,
            category: category,
            before_img: beforeUrl,
            after_img: afterUrl
          }
        ]);

        if (insertRes.error) throw insertRes.error;

        addProjectForm.reset();
        renderAdminProjectList();
        fetchLiveProjects();
        alert('Project successfully published live to all visitors!');
      } catch (err) {
        console.error(err);
        alert('Upload failed: ' + (err.message || 'Check database permissions.'));
      } finally {
        publishProjBtn.disabled = false;
        publishProjBtn.textContent = 'Publish Project';
      }
    });
  }

  /* ------------------------------------------------------------------
     8. Blog "Read More" Toggle
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
     9. Quote Form Engine (Direct WhatsApp Dispatch)
     ------------------------------------------------------------------ */
  var quoteModal = document.getElementById('quoteModal');
  var quoteModalClose = document.getElementById('modalClose');
  var quoteForm = document.getElementById('quoteForm');
  var modalSuccess = document.getElementById('modalSuccess');
  var modalFormWrap = document.getElementById('modalFormWrap');
  var modalDoneBtn = document.getElementById('modalDoneBtn');
  var serviceSelect = document.getElementById('q-service');
  var dateInput = document.getElementById('q-date');
  var waFollowUpAction = document.getElementById('waFollowUpAction');

  if (dateInput) {
    dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
  }

  function openQuoteModal(triggerEl) {
    var preset = triggerEl && triggerEl.getAttribute('data-service');
    if (preset && serviceSelect) {
      Array.prototype.forEach.call(serviceSelect.options, function (opt) {
        if (opt.value === preset || opt.text === preset) serviceSelect.value = opt.value || opt.text;
      });
    }
    if (quoteModal) {
      quoteModal.classList.add('open');
      quoteModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeQuoteModal() {
    if (quoteModal) {
      quoteModal.classList.remove('open');
      quoteModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setTimeout(function () {
        if (modalSuccess) modalSuccess.hidden = true;
        if (modalFormWrap) modalFormWrap.hidden = false;
        if (quoteForm) quoteForm.reset();
      }, 400);
    }
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-open-modal]'), function (trigger) {
    trigger.addEventListener('click', function () { openQuoteModal(trigger); });
  });

  if (quoteModalClose) quoteModalClose.addEventListener('click', closeQuoteModal);
  if (modalDoneBtn) modalDoneBtn.addEventListener('click', closeQuoteModal);
  if (quoteModal) {
    quoteModal.addEventListener('click', function(e) { if (e.target === quoteModal) closeQuoteModal(); });
  }

  var fieldMessages = {
    name: 'Please enter your full name.',
    email: 'Please enter a valid email address.',
    phone: 'A phone number is required.',
    city: 'Please select your area.',
    service: 'Please select a service.',
    date: 'Please choose a preferred date.',
    time: 'Please choose a preferred time.'
  };

  function setFieldError(fieldName, message) {
    var input = document.getElementById('q-' + fieldName);
    var errorEl = document.getElementById('err-' + fieldName);
    if (input && errorEl) {
      input.closest('.form-row').classList.add('has-error');
      errorEl.textContent = message || '';
    }
  }

  function clearFieldError(fieldName) {
    var input = document.getElementById('q-' + fieldName);
    var errorEl = document.getElementById('err-' + fieldName);
    if (input && errorEl) {
      input.closest('.form-row').classList.remove('has-error');
      errorEl.textContent = '';
    }
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

    var firstInvalid = null;
    var isValid = true;

    Object.keys(data).forEach(clearFieldError);

    if (!data.name) { setFieldError('name', fieldMessages.name); isValid = false; firstInvalid = firstInvalid || 'name'; }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { setFieldError('email', fieldMessages.email); isValid = false; firstInvalid = firstInvalid || 'email'; }
    if (!data.phone || data.phone.replace(/\D/g, '').length < 10) { setFieldError('phone', fieldMessages.phone); isValid = false; firstInvalid = firstInvalid || 'phone'; }
    if (!data.city) { setFieldError('city', fieldMessages.city); isValid = false; firstInvalid = firstInvalid || 'city'; }
    if (!data.service) { setFieldError('service', fieldMessages.service); isValid = false; firstInvalid = firstInvalid || 'service'; }
    if (!data.date) { setFieldError('date', fieldMessages.date); isValid = false; firstInvalid = firstInvalid || 'date'; }
    if (!data.time) { setFieldError('time', fieldMessages.time); isValid = false; firstInvalid = firstInvalid || 'time'; }

    return { isValid: isValid, data: data, firstInvalid: firstInvalid };
  }

  ['name', 'email', 'phone', 'city', 'service', 'description', 'date', 'time'].forEach(function (key) {
    var input = document.getElementById('q-' + key);
    if (input) {
      input.addEventListener('input', function () { clearFieldError(key); });
      input.addEventListener('change', function () { clearFieldError(key); });
    }
  });

  if (quoteForm) {
    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var validation = validateForm();

      if (!validation.isValid) {
        var invalidEl = document.getElementById('q-' + validation.firstInvalid);
        if (invalidEl) invalidEl.focus();
        return;
      }

      modalFormWrap.hidden = true;
      modalSuccess.hidden = false;

      var clientPhone = "16723995554";
      var waMessage = 
        "🌿 *NEW QUOTE REQUEST — H&H IVY LANDSCAPING*\n\n" +
        "👤 *Name:* " + validation.data.name + "\n" +
        "📞 *Phone:* " + validation.data.phone + "\n" +
        "📧 *Email:* " + validation.data.email + "\n" +
        "📍 *City:* " + validation.data.city + "\n" +
        "🛠️ *Service:* " + validation.data.service + "\n" +
        "📅 *Preferred Date:* " + validation.data.date + "\n" +
        "⏰ *Preferred Time:* " + validation.data.time + "\n" +
        (validation.data.description ? "📝 *Notes:* " + validation.data.description + "\n" : "");

      var waUrl = "https://wa.me/" + clientPhone + "?text=" + encodeURIComponent(waMessage);

      if (waFollowUpAction) {
        waFollowUpAction.innerHTML = 
          '<a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-glow btn-block" style="background:#25D366; border-color:#25D366;">' +
            '<span>Open in WhatsApp</span> &rarr;' +
          '</a>';
      }

      window.open(waUrl, '_blank');
    });
  }

  /* ------------------------------------------------------------------
     10. Live Weather & Seasonal Turf Advisory Banner
     ------------------------------------------------------------------ */
  var weatherBanner = document.getElementById('weatherBanner');
  var weatherTempEl = document.getElementById('weatherTemp');
  var weatherMsgEl = document.getElementById('weatherMsg');
  var closeWeatherBtn = document.getElementById('closeWeatherBtn');

  if (closeWeatherBtn && weatherBanner) {
    closeWeatherBtn.addEventListener('click', function() {
      weatherBanner.classList.add('hidden');
      try { sessionStorage.setItem('hh_weather_dismissed', '1'); } catch (e) {}
    });
  }

  function fetchSurreyWeather() {
    if (sessionStorage.getItem('hh_weather_dismissed') === '1' && weatherBanner) {
      weatherBanner.classList.add('hidden');
      return;
    }

    fetch('https://api.open-meteo.com/v1/forecast?latitude=49.1913&longitude=-122.8490&current=temperature_2m,weather_code&timezone=America%2FVancouver')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data || !data.current || !weatherTempEl || !weatherMsgEl) return;
        var temp = Math.round(data.current.temperature_2m);
        var code = data.current.weather_code;
        var month = new Date().getMonth();

        weatherTempEl.textContent = 'Surrey, BC • ' + temp + '°C';

        if (code >= 51 && code <= 67) {
          weatherMsgEl.textContent = '🌧️ Rainy spell in Surrey: Ideal ground moisture for aerating and deep fertilizer uptake!';
        } else if (month >= 2 && month <= 4) {
          weatherMsgEl.textContent = '🌱 Spring Revival: Core Aeration & Power Raking slots are filling fast in Surrey.';
        } else if (month >= 5 && month <= 7) {
          weatherMsgEl.textContent = '☀️ Summer Care: Weekly precision mowing & hydration plans active across Surrey.';
        } else if (month >= 8 && month <= 10) {
          weatherMsgEl.textContent = '🍂 Fall Cleanups & Over-seeding: Prep your lawn before Pacific Northwest winter rains.';
        } else {
          weatherMsgEl.textContent = '❄️ Winter Garden Care: Pruning & structural hedging protection for coastal BC properties.';
        }
      })
      .catch(function() {
        if (weatherTempEl && weatherMsgEl) {
          weatherTempEl.textContent = 'Surrey, BC';
          weatherMsgEl.textContent = '🌱 Regular maintenance slots open for Surrey, Delta & White Rock properties.';
        }
      });
  }

  fetchSurreyWeather();

  /* ------------------------------------------------------------------
     11. Comprehensive Animation Suite
     ------------------------------------------------------------------ */

  // A. Scroll-Triggered Animated Counters
  var counterObserver = new IntersectionObserver(function(entries, observer) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;

      var duration = 1600;
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        var easeOut = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(easeOut * target);

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.textContent = target;
        }
      }

      window.requestAnimationFrame(step);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-count]').forEach(function(counter) {
    counterObserver.observe(counter);
  });

  // B. Staggered Scroll-Reveal on Grids
  var revealTargets = document.querySelectorAll('.service-card, .project-card, .blog-card, .bento-item');
  revealTargets.forEach(function(el) { el.classList.add('reveal-init'); });

  var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -40px 0px', threshold: 0.15 });

  revealTargets.forEach(function(el, idx) {
    el.style.transitionDelay = ((idx % 3) * 110) + 'ms';
    revealObserver.observe(el);
  });

  // C. Interactive 3D Card Tilt on Hover (Desktop)
  if (!reduceMotion && window.innerWidth > 960) {
    var tiltCards = document.querySelectorAll('.service-card, .project-card, .blog-card');
    tiltCards.forEach(function(card) {
      card.classList.add('tilt-card');

      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;

        var rotateX = ((y - centerY) / centerY) * -6;
        var rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(-4px)';
      });

      card.addEventListener('mouseleave', function() {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  // D. Magnetic Pull Effect on Primary CTA Buttons
  if (!reduceMotion && window.innerWidth > 960) {
    var magnetics = document.querySelectorAll('.nav-cta, .hero .btn-primary, .admin-trigger-btn');
    magnetics.forEach(function(btn) {
      btn.classList.add('magnetic-btn');

      btn.addEventListener('mousemove', function(e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - (rect.left + rect.width / 2);
        var y = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform = 'translate(' + (x * 0.28) + 'px, ' + (y * 0.28) + 'px)';
      });

      btn.addEventListener('mouseleave', function() {
        btn.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  // E. Falling Ivy Leaves Particle Canvas Engine
  var canvas = document.getElementById('ivyLeafCanvas');
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var leaves = [];
    var leafCount = 14;

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    for (var i = 0; i < leafCount; i++) {
      leaves.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 9 + 8,
        speedX: Math.random() * 0.8 - 0.2,
        speedY: Math.random() * 0.7 + 0.4,
        angle: Math.random() * 360,
        spin: Math.random() * 0.8 - 0.4,
        opacity: Math.random() * 0.4 + 0.25
      });
    }

    function drawLeaf(ctx, x, y, size, angle, opacity) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.bezierCurveTo(size / 2, -size / 2, size / 2, size / 2, 0, size);
      ctx.bezierCurveTo(-size / 2, size / 2, -size / 2, -size / 2, 0, -size);
      ctx.fillStyle = 'rgba(71, 151, 59, ' + opacity + ')';
      ctx.fill();
      ctx.restore();
    }

    function renderLeaves() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      leaves.forEach(function(l) {
        l.x += l.speedX;
        l.y += l.speedY;
        l.angle += l.spin;

        if (l.y > canvas.height + 20) {
          l.y = -20;
          l.x = Math.random() * canvas.width;
        }
        if (l.x > canvas.width + 20) l.x = -20;
        if (l.x < -20) l.x = canvas.width + 20;

        drawLeaf(ctx, l.x, l.y, l.size, l.angle, l.opacity);
      });
      window.requestAnimationFrame(renderLeaves);
    }
    renderLeaves();
  }

})();