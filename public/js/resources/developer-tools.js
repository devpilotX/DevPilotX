/* ==========================================================================
   DEVELOPER TOOLS RESOURCE PAGE — JAVASCRIPT
   Page: /resources/developer-tools
   Handles: smooth scroll nav, scroll reveal, active section tracking
   ========================================================================== */

(function () {
  'use strict';

  /* ========== SMOOTH SCROLL FOR QUICK NAV CARDS ========== */
  var quicknavCards = document.querySelectorAll('.quicknav-card[href^="#"]');
  quicknavCards.forEach(function (card) {
    card.addEventListener('click', function (e) {
      var targetId = card.getAttribute('href');
      if (!targetId || targetId.length < 2) return;
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      var offset = 80;
      var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.pushState(null, null, targetId);
    });
  });

  /* ========== SCROLL REVEAL FOR TOOL REVIEW CARDS ========== */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
    );

    var revealTargets = document.querySelectorAll(
      '.tool-review, .quicknav-card, .res-cta-card'
    );
    revealTargets.forEach(function (el) {
      el.classList.add('reveal-target');
      revealObserver.observe(el);
    });
  }

  /* ========== ACTIVE QUICKNAV HIGHLIGHT ON SCROLL ========== */
  var sections = document.querySelectorAll('.res-section[id]');
  var navCards = document.querySelectorAll('.quicknav-card[href^="#"]');

  if (sections.length > 0 && navCards.length > 0) {
    var ticking = false;

    var highlightActiveNav = function () {
      var scrollPos = window.pageYOffset + 120;
      var activeId = '';

      sections.forEach(function (section) {
        var top = section.offsetTop;
        var height = section.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          activeId = '#' + section.id;
        }
      });

      navCards.forEach(function (card) {
        if (card.getAttribute('href') === activeId) {
          card.classList.add('quicknav-active');
        } else {
          card.classList.remove('quicknav-active');
        }
      });
    };

    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          requestAnimationFrame(function () {
            highlightActiveNav();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );

    highlightActiveNav();
  }

  /* ========== KEYBOARD ACCESSIBILITY FOR QUICKNAV ========== */
  quicknavCards.forEach(function (card) {
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
})();