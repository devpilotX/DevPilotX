/* ==========================================================================
   ESSENTIAL SOFTWARE PAGE — JavaScript
   Handles smooth scrolling for TOC links and scroll spy for active sections
   ========================================================================== */
(function () {
  'use strict';

  /* ========== SMOOTH SCROLL FOR TOC LINKS ========== */
  var tocLinks = document.querySelectorAll('.ess-toc__card');

  tocLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;

      var target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      var navHeight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
        10
      ) || 62;

      var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      /* Update URL hash without jumping */
      if (history.pushState) {
        history.pushState(null, null, href);
      }
    });
  });

  /* ========== SCROLL SPY — HIGHLIGHT ACTIVE TOC CARD ========== */
  var sections = document.querySelectorAll('.ess-section[id]');

  if (sections.length > 0 && tocLinks.length > 0) {
    var observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          tocLinks.forEach(function (card) {
            var cardHref = card.getAttribute('href');
            if (cardHref === '#' + id) {
              card.classList.add('ess-toc__card--active');
            } else {
              card.classList.remove('ess-toc__card--active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ========== EXPAND/COLLAPSE TOOL DETAILS (OPTIONAL ENHANCEMENT) ========== */
  /* Tools are fully expanded by default for SEO and content visibility */

})();