/**
 * ==========================================================================
 * Value.Codes — Home Page Scripts
 * ==========================================================================
 *
 * Handles:
 *   1. Tool card keyboard accessibility (Enter/Space to activate)
 *   2. Intersection Observer scroll reveal (progressive enhancement)
 *
 * Rules:
 *   - Zero inline JS in HTML
 *   - All visual state via CSS classes (no .style manipulation)
 *   - Feature detection before IntersectionObserver use
 *
 * @version  2.0.0
 * @license  MIT
 * ==========================================================================
 */

(function () {
  'use strict';


  /* ======================================================================
     1. TOOL CARDS — KEYBOARD ACCESSIBILITY
     ====================================================================== */

  var toolCards = document.querySelectorAll('.tool-card');

  toolCards.forEach(function (card) {
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });


  /* ======================================================================
     2. SCROLL REVEAL — PROGRESSIVE ENHANCEMENT
     ======================================================================
     Only runs if IntersectionObserver is supported.
     Cards start hidden via .reveal-target class and animate in
     via .revealed class when they enter the viewport.
     ====================================================================== */

  if ('IntersectionObserver' in window) {

    var revealTargets = document.querySelectorAll(
      '.tool-card, .resource-card, .contribute-card, .chat-card'
    );

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    var viewportH = window.innerHeight;
    revealTargets.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < viewportH) {
        el.classList.add('revealed');
      } else {
        el.classList.add('reveal-target');
        revealObserver.observe(el);
      }
    });
  }


})();
