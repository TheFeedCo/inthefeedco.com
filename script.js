/* TheFeedCo. — script.js
   Vanilla JS: sticky-nav state, mobile menu, scroll reveal, hero sequence,
   questionnaire validation + submission. Everything degrades gracefully. */
(function () {
  'use strict';

  var d = document;

  /* ---------- Sticky header: gain border + shadow after 8px ---------- */
  var header = d.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile menu ---------- */
  var toggle = d.querySelector('.nav-toggle');
  var menu = d.getElementById('mobile-menu');
  if (toggle && menu) {
    var closeBtn = menu.querySelector('.menu-close');
    var lastFocus = null;

    // Keep keyboard focus inside the open overlay.
    var trapFocus = function (e) {
      if (e.key !== 'Tab') { return; }
      var els = menu.querySelectorAll('a[href], button:not([disabled])');
      if (!els.length) { return; }
      var first = els[0], last = els[els.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    var openMenu = function () {
      lastFocus = d.activeElement;
      menu.hidden = false;
      // Double rAF so the opacity transition runs after display change.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { menu.classList.add('is-open'); });
      });
      d.body.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      d.addEventListener('keydown', trapFocus);
      if (closeBtn) { closeBtn.focus(); }
    };

    var closeMenu = function () {
      menu.classList.remove('is-open');
      d.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      d.removeEventListener('keydown', trapFocus);
      window.setTimeout(function () { menu.hidden = true; }, 230);
      if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
    };

    toggle.addEventListener('click', function () {
      if (toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); } else { openMenu(); }
    });
    if (closeBtn) { closeBtn.addEventListener('click', closeMenu); }
    // Backdrop click (the overlay itself, not its contents) closes.
    menu.addEventListener('click', function (e) {
      if (e.target === menu) { closeMenu(); }
    });
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { closeMenu(); }
    });
  }

  /* ---------- Scroll reveal (animate once) ---------- */
  var revealEls = Array.prototype.slice.call(d.querySelectorAll('.reveal'));
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    }
  }

  /* ---------- Hero load sequence ---------- */
  var heroIn = function () {
    requestAnimationFrame(function () {
      d.querySelectorAll('.hero-item').forEach(function (el) {
        el.classList.add('is-visible');
      });
    });
  };
  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', heroIn);
  } else {
    heroIn();
  }

  /* ---------- Questionnaire: validation + submission ---------- */
  var form = d.getElementById('enquiry-form');
  if (!form) { return; }

  form.setAttribute('novalidate', 'novalidate'); // JS takes over from native validation

  /* Preselect the service the visitor clicked on the services grid
     (index.html links here with ?interest=website|ads|full-funnel). */
  var interestMap = {
    'website': 'Website Creation',
    'ads': 'Paid Ads Management',
    'full-funnel': 'The Full Funnel (both)'
  };
  var interestKey = new URLSearchParams(window.location.search).get('interest');
  if (interestKey && interestMap[interestKey]) {
    var preselect = form.querySelector(
      'input[name="interested_in"][value="' + interestMap[interestKey] + '"]'
    );
    if (preselect) { preselect.checked = true; }
  }

  var alertBox = d.getElementById('form-alert');
  var submitBtn = form.querySelector('button[type="submit"]');
  var submitLabel = submitBtn ? submitBtn.innerHTML : '';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var showError = function (id, message) {
    var errEl = d.getElementById('err-' + id);
    if (errEl) {
      errEl.textContent = message;
      errEl.hidden = false;
    }
  };

  var clearError = function (id) {
    var errEl = d.getElementById('err-' + id);
    if (errEl) { errEl.hidden = true; }
  };

  var validateField = function (id) {
    switch (id) {
      case 'name': {
        var name = d.getElementById('name');
        if (!name.value.trim()) { showError('name', 'Please tell us your name.'); name.setAttribute('aria-invalid', 'true'); return name; }
        name.removeAttribute('aria-invalid'); clearError('name'); return null;
      }
      case 'business_name': {
        var biz = d.getElementById('business_name');
        if (!biz.value.trim()) { showError('business_name', "Please tell us your brand's name."); biz.setAttribute('aria-invalid', 'true'); return biz; }
        biz.removeAttribute('aria-invalid'); clearError('business_name'); return null;
      }
      case 'interested_in': {
        if (!form.querySelector('input[name="interested_in"]:checked')) {
          showError('interested_in', 'Please pick an option — “Not sure yet” counts.');
          return form.querySelector('input[name="interested_in"]');
        }
        clearError('interested_in'); return null;
      }
      case 'monthly_budget': {
        if (!form.querySelector('input[name="monthly_budget"]:checked')) {
          showError('monthly_budget', 'Please choose a range — a rough guess is fine.');
          return form.querySelector('input[name="monthly_budget"]');
        }
        clearError('monthly_budget'); return null;
      }
      case 'email': {
        var email = d.getElementById('email');
        var v = email.value.trim();
        if (!v) { showError('email', 'Please enter your email address.'); email.setAttribute('aria-invalid', 'true'); return email; }
        if (!EMAIL_RE.test(v)) { showError('email', "That doesn't look like a valid email — mind checking it?"); email.setAttribute('aria-invalid', 'true'); return email; }
        email.removeAttribute('aria-invalid'); clearError('email'); return null;
      }
      case 'consent': {
        var consent = d.getElementById('consent');
        if (!consent.checked) {
          showError('consent', "Please tick the consent box — POPIA requires it before we're allowed to reply to you.");
          consent.closest('.checkbox').classList.add('has-error');
          return consent;
        }
        consent.closest('.checkbox').classList.remove('has-error');
        clearError('consent'); return null;
      }
    }
    return null;
  };

  var REQUIRED = ['name', 'business_name', 'interested_in', 'monthly_budget', 'email', 'consent'];

  // Re-validate as the visitor fixes things.
  REQUIRED.forEach(function (id) {
    var controls = form.querySelectorAll('#' + id + ', input[name="' + id + '"]');
    controls.forEach(function (el) {
      el.addEventListener(el.type === 'radio' || el.type === 'checkbox' ? 'change' : 'input', function () {
        validateField(id === 'consent' ? 'consent' : (el.name || el.id));
      });
    });
  });

  var setSending = function (sending) {
    if (!submitBtn) { return; }
    submitBtn.disabled = sending;
    submitBtn.setAttribute('aria-busy', sending ? 'true' : 'false');
    submitBtn.innerHTML = sending ? 'Sending…' : submitLabel;
  };

  var failSubmit = function () {
    setSending(false);
    if (alertBox) {
      alertBox.hidden = false;
      alertBox.focus();
    }
  };

  form.addEventListener('submit', function (e) {
    if (alertBox) { alertBox.hidden = true; }

    var firstInvalid = null;
    REQUIRED.forEach(function (id) {
      var invalid = validateField(id);
      if (invalid && !firstInvalid) { firstInvalid = invalid; }
    });

    if (firstInvalid) {
      e.preventDefault();
      firstInvalid.focus();
      if (firstInvalid.scrollIntoView) {
        firstInvalid.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      return;
    }

    if (!window.fetch) {
      // Old browser: let the native POST run — Web3Forms' redirect field
      // sends the visitor on to the thank-you page.
      setSending(true);
      return;
    }

    e.preventDefault();
    setSending(true);

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (res.ok) {
        // Relative URL so it works on both github.io/repo and the custom domain.
        window.location.href = './thank-you.html';
      } else {
        failSubmit();
      }
    }).catch(failSubmit);
  });
})();
