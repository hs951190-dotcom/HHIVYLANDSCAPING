/* ==========================================================================
   H&H IVY LANDSCAPING — Site Interactions, Gallery Slider & Admin Portal
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

  /* ------------------------------------------------------------------
     3. Active Section Spy & Ivy Vine Scroll
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
     4. Before & After Projects (Data Store & Rendering)
     ------------------------------------------------------------------ */
  var DEFAULT_PROJECTS = [
    {
      id: 1,
      title: "South Surrey Full Lawn Revival",
      category: "Sod Installation",
      before: "https://images.unsplash.com/photo-1557429287-b2e26467fc2b?q=80&w=800&auto=format&fit=crop",
      after: "blog-lawn.jpg"
    },
    {
      id: 2,
      title: "Crescent Beach Privacy Hedge Shaping",
      category: "Hedge Trimming & Shaping",
      before: "https://images.unsplash.com/photo-1584467735815-f778f274e296?q=80&w=800&auto=format&fit=crop",
      after: "blog-hedge.jpg"
    },
    {
      id: 3,
      title: "Morgan Creek Winter Garden Prep",
      category: "Garden Planting & Cleanups",
      before: "https://images.unsplash.com/photo-1508873696983-2df5293cb32b?q=80&w=800&auto=format&fit=crop",
      after: "blog-winter.jpg"
    }
  ];

  function getProjects() {
    try {
      var saved = localStorage.getItem('hh_ivy_projects');
      return saved ? JSON.parse(saved) : DEFAULT_PROJECTS;
    } catch (e) {
      return DEFAULT_PROJECTS;
    }
  }

  function saveProjects(projects) {
    try {
      localStorage.setItem('hh_ivy_projects', JSON.stringify(projects));
    } catch (e) {}
  }

  var galleryGrid = document.getElementById('galleryGrid');

  function renderGallery() {
    var projects = getProjects();
    galleryGrid.innerHTML = '';

    projects.forEach(function (proj) {
      var card = document.createElement('article');
      card.className = 'project-card';
      card.innerHTML = 
        '<div class="project-card-thumb">' +
          '<img src="' + proj.after + '" alt="' + proj.title + '" loading="lazy">' +
          '<div class="project-badge-split"><span>Before</span> / <span>After</span></div>' +
        '</div>' +
        '<div class="project-card-info">' +
          '<span class="project-tag">' + proj.category + '</span>' +
          '<h3>' + proj.title + '</h3>' +
          '<span class="project-view-cta">Interactive Slider &rarr;</span>' +
        '</div>';

      card.addEventListener('click', function () {
        openSliderModal(proj);
      });

      galleryGrid.appendChild(card);
    });
  }
  renderGallery();

  /* ------------------------------------------------------------------
     5. Interactive Comparison Slider Modal Logic
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

  function openSliderModal(proj) {
    sliderProjectTitle.textContent = proj.title;
    sliderProjectCategory.textContent = proj.category;
    compImgBefore.src = proj.before;
    compImgAfter.src = proj.after;

    // Reset slider to 50%
    setSliderPosition(50);

    sliderModal.classList.add('open');
    sliderModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeSliderModal() {
    sliderModal.classList.remove('open');
    sliderModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  sliderModalClose.addEventListener('click', closeSliderModal);
  sliderModal.addEventListener('click', function (e) {
    if (e.target === sliderModal) closeSliderModal();
  });

  function setSliderPosition(percentage) {
    var p = Math.max(0, Math.min(100, percentage));
    compBeforeWrapper.style.width = p + '%';
    compHandle.style.left = p + '%';
  }

  var isSliding = false;

  function handleSliderMove(e) {
    if (!isSliding) return;
    var rect = compContainer.getBoundingClientRect();
    var clientX = e.clientX || (e.touches && e.touches[0].clientX);
    var position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(position);
  }

  compContainer.addEventListener('mousedown', function (e) { isSliding = true; handleSliderMove(e); });
  compContainer.addEventListener('touchstart', function (e) { isSliding = true; handleSliderMove(e); });
  window.addEventListener('mousemove', handleSliderMove);
  window.addEventListener('touchmove', handleSliderMove);
  window.addEventListener('mouseup', function () { isSliding = false; });
  window.addEventListener('touchend', function () { isSliding = false; });

  /* ------------------------------------------------------------------
     6. Client Admin Portal Logic (Passcode Protected)
     ------------------------------------------------------------------ */
  var ADMIN_PASS = 'ivy1993'; // Passcode for your client
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

  openAdminBtn.addEventListener('click', openAdminModal);
  footerAdminLink.addEventListener('click', function(e) { e.preventDefault(); openAdminModal(); });
  adminModalClose.addEventListener('click', closeAdminModal);
  adminModal.addEventListener('click', function(e) { if (e.target === adminModal) closeAdminModal(); });

  adminLoginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var entered = document.getElementById('adminPass').value;
    if (entered === ADMIN_PASS) {
      adminLoginErr.textContent = '';
      adminLoginView.hidden = true;
      adminDashboardView.hidden = false;
      renderAdminProjectList();
    } else {
      adminLoginErr.textContent = 'Incorrect passcode. Please try again.';
    }
  });

  adminLogoutBtn.addEventListener('click', function () {
    adminDashboardView.hidden = true;
    adminLoginView.hidden = false;
    adminLoginForm.reset();
  });

  function renderAdminProjectList() {
    var projects = getProjects();
    adminProjectsListWrap.innerHTML = '';

    projects.forEach(function (proj) {
      var item = document.createElement('div');
      item.className = 'admin-item-row';
      item.innerHTML = 
        '<div class="admin-item-info">' +
          '<img src="' + proj.after + '" class="admin-item-thumb" alt="">' +
          '<div><strong>' + proj.title + '</strong><br><small style="color:var(--ink-soft);">' + proj.category + '</small></div>' +
        '</div>' +
        '<button class="admin-delete-btn" data-id="' + proj.id + '">Delete</button>';

      item.querySelector('.admin-delete-btn').addEventListener('click', function () {
        var updated = projects.filter(function (p) { return p.id !== proj.id; });
        saveProjects(updated);
        renderAdminProjectList();
        renderGallery();
      });

      adminProjectsListWrap.appendChild(item);
    });
  }

  function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function() { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

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

    var beforeB64 = await fileToBase64(beforeFile);
    var afterB64 = await fileToBase64(afterFile);

    var newProject = {
      id: Date.now(),
      title: title,
      category: category,
      before: beforeB64,
      after: afterB64
    };

    var current = getProjects();
    current.unshift(newProject);
    saveProjects(current);

    addProjectForm.reset();
    renderAdminProjectList();
    renderGallery();
    alert('Project published successfully to your live website gallery!');
  });

  /* ------------------------------------------------------------------
     7. Blog "Read More" Toggle
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
     8. Quote Form Submissions (Web3Forms + Automatic WhatsApp Dispatch)
     ------------------------------------------------------------------ */
  var quoteModal = document.getElementById('quoteModal');
  var quoteModalClose = document.getElementById('modalClose');
  var quoteForm = document.getElementById('quoteForm');
  var modalSuccess = document.getElementById('modalSuccess');
  var modalFormWrap = document.getElementById('modalFormWrap');
  var modalDoneBtn = document.getElementById('modalDoneBtn');
  var serviceSelect = document.getElementById('q-service');
  var dateInput = document.getElementById('q-date');

  (function setMinDate() {
    var today = new Date();
    dateInput.setAttribute('min', today.toISOString().split('T')[0]);
  })();

  function openQuoteModal(triggerEl) {
    var preset = triggerEl && triggerEl.getAttribute('data-service');
    if (preset) {
      Array.prototype.forEach.call(serviceSelect.options, function (opt) {
        if (opt.value === preset || opt.text === preset) serviceSelect.value = opt.value || opt.text;
      });
    }
    quoteModal.classList.add('open');
    quoteModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeQuoteModal() {
    quoteModal.classList.remove('open');
    quoteModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(function () {
      modalSuccess.hidden = true;
      modalFormWrap.hidden = false;
      quoteForm.reset();
    }, 400);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-open-modal]'), function (trigger) {
    trigger.addEventListener('click', function () { openQuoteModal(trigger); });
  });

  quoteModalClose.addEventListener('click', closeQuoteModal);
  modalDoneBtn.addEventListener('click', closeQuoteModal);
  quoteModal.addEventListener('click', function(e) { if (e.target === quoteModal) closeQuoteModal(); });

  quoteForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var result = validateForm();

    if (!result.isValid) {
      var invalidInput = document.getElementById('q-' + result.firstInvalidField);
      if (invalidInput) invalidInput.focus();
      return;
    }

    var formData = new FormData(quoteForm);

    // 1. Submit to Web3Forms for Email notification
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    }).then(function(res) {
      if (res.ok) {
        modalFormWrap.hidden = true;
        modalSuccess.hidden = false;

        // 2. Prepare pre-filled WhatsApp message
        var clientPhone = "16723995554"; // H&H Ivy Landscaping WhatsApp number
        var waMessage = 
          "🌿 *NEW QUOTE REQUEST — H&H IVY LANDSCAPING*\n\n" +
          "👤 *Name:* " + result.data.name + "\n" +
          "📞 *Phone:* " + result.data.phone + "\n" +
          "📧 *Email:* " + result.data.email + "\n" +
          "📍 *City:* " + result.data.city + "\n" +
          "🛠️ *Service:* " + result.data.service + "\n" +
          "📅 *Preferred Date:* " + result.data.date + "\n" +
          "⏰ *Preferred Time:* " + result.data.time + "\n" +
          (result.data.description ? "📝 *Notes:* " + result.data.description + "\n" : "");

        var waUrl = "https://wa.me/" + clientPhone + "?text=" + encodeURIComponent(waMessage);

        // 3. Open WhatsApp in a new tab/app after 400ms delay
        setTimeout(function() {
          window.open(waUrl, '_blank');
        }, 400);

      } else {
        alert('There was an error submitting your request. Please try again.');
      }
    }).catch(function() {
      alert('Network error. Please try again.');
    });
  });


  /* ------------------------------------------------------------------
     Live Surrey Weather & Seasonal Turf Advisory Banner
     ------------------------------------------------------------------ */
  var weatherBanner = document.getElementById('weatherBanner');
  var weatherTempEl = document.getElementById('weatherTemp');
  var weatherMsgEl = document.getElementById('weatherMsg');
  var closeWeatherBtn = document.getElementById('closeWeatherBtn');

  if (closeWeatherBtn) {
    closeWeatherBtn.addEventListener('click', function() {
      weatherBanner.classList.add('hidden');
      try { sessionStorage.setItem('hh_weather_dismissed', '1'); } catch (e) {}
    });
  }

  // Surrey, BC Coordinates: 49.1913° N, 122.8490° W
  function fetchSurreyWeather() {
    if (sessionStorage.getItem('hh_weather_dismissed') === '1') {
      weatherBanner.classList.add('hidden');
      return;
    }

    fetch('https://api.open-meteo.com/v1/forecast?latitude=49.1913&longitude=-122.8490&current=temperature_2m,weather_code&timezone=America%2FVancouver')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (!data || !data.current) return;
        var temp = Math.round(data.current.temperature_2m);
        var code = data.current.weather_code;
        var month = new Date().getMonth(); // 0 = Jan, 11 = Dec

        weatherTempEl.textContent = 'Surrey, BC • ' + temp + '°C';

        // Dynamic seasonal & condition advice
        if (code >= 51 && code <= 67) {
          // Rain in Surrey
          weatherMsgEl.textContent = '🌧️ Rainy spell in Surrey: Ideal ground moisture for aerating and deep fertilizer uptake!';
        } else if (month >= 2 && month <= 4) {
          // Spring (March - May)
          weatherMsgEl.textContent = '🌱 Spring Revival: Core Aeration & Power Raking slots are filling fast in Surrey.';
        } else if (month >= 5 && month <= 7) {
          // Summer (June - August)
          weatherMsgEl.textContent = '☀️ Summer Care: Weekly precision mowing & hydration plans active across Surrey.';
        } else if (month >= 8 && month <= 10) {
          // Fall (Sept - Nov)
          weatherMsgEl.textContent = '🍂 Fall Cleanups & Over-seeding: Prep your lawn before Pacific Northwest winter rains.';
        } else {
          // Winter (Dec - Feb)
          weatherMsgEl.textContent = '❄️ Winter Garden Care: Pruning & structural hedging protection for coastal BC properties.';
        }
      })
      .catch(function() {
        // Fallback banner text if offline
        weatherTempEl.textContent = 'Surrey, BC';
        weatherMsgEl.textContent = '🌱 Regular maintenance slots open for Surrey, Delta & White Rock properties.';
      });
  }

  fetchSurreyWeather();

})();