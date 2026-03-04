/**
 * ==========================================================================
 * Value.Codes — Global Scripts
 * ==========================================================================
 *
 * Handles:
 *   1. Skip link injection (accessibility)
 *   2. Scroll-to-top button
 *   3. Cookie consent banner (GDPR / AdSense compliant)
 *   4. Smooth scroll for anchor links
 *
 * Rules:
 *   - Zero inline JS anywhere in the project
 *   - Zero inline styles — all visual state via CSS classes
 *   - All DOM elements created via createElement (no innerHTML for security)
 *   - Passive event listeners for scroll performance
 *   - requestAnimationFrame for scroll-driven UI
 *
 * @version  2.0.0
 * @license  MIT
 * ==========================================================================
 */

(function () {
  'use strict';


  /* ======================================================================
     1. SKIP LINK — ACCESSIBILITY
     ====================================================================== */

  var skipLink       = document.createElement('a');
  skipLink.href      = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to main content';
  document.body.insertBefore(skipLink, document.body.firstChild);


  /* ======================================================================
     2. SCROLL TO TOP BUTTON
     ====================================================================== */

  var scrollBtn = document.createElement('button');
  scrollBtn.className = 'scroll-to-top';
  scrollBtn.setAttribute('aria-label', 'Scroll to top');
  scrollBtn.setAttribute('type', 'button');

  /* Create SVG icon via DOM API (no innerHTML) */
  var ns = 'http://www.w3.org/2000/svg';

  var scrollSvg = document.createElementNS(ns, 'svg');
  scrollSvg.setAttribute('width', '18');
  scrollSvg.setAttribute('height', '18');
  scrollSvg.setAttribute('viewBox', '0 0 24 24');
  scrollSvg.setAttribute('fill', 'none');
  scrollSvg.setAttribute('stroke', 'currentColor');
  scrollSvg.setAttribute('stroke-width', '2.5');
  scrollSvg.setAttribute('stroke-linecap', 'round');
  scrollSvg.setAttribute('stroke-linejoin', 'round');
  scrollSvg.setAttribute('aria-hidden', 'true');

  var scrollPath = document.createElementNS(ns, 'path');
  scrollPath.setAttribute('d', 'M18 15l-6-6-6 6');
  scrollSvg.appendChild(scrollPath);
  scrollBtn.appendChild(scrollSvg);
  document.body.appendChild(scrollBtn);

  /* Throttled scroll listener with rAF */
  var scrollTicking = false;

  window.addEventListener('scroll', function () {
    if (!scrollTicking) {
      window.requestAnimationFrame(function () {
        if (window.pageYOffset > 400) {
          scrollBtn.classList.add('visible');
        } else {
          scrollBtn.classList.remove('visible');
        }
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  scrollBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


  /* ======================================================================
     3. COOKIE CONSENT BANNER (GDPR / AdSense Safe)
     ======================================================================
     - Shows once per device (localStorage)
     - Accept = stored as 'accepted'
     - Decline = stored as 'declined'
     - No tracking scripts loaded until consent is given
     ====================================================================== */

  var COOKIE_KEY = 'vc_cookie_consent';

  if (!localStorage.getItem(COOKIE_KEY)) {

    var banner     = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');

    var bannerText = document.createElement('p');
    bannerText.textContent = 'We use cookies to improve your experience. By continuing you accept our ';

    var privacyLink     = document.createElement('a');
    privacyLink.href    = '/legal/privacy-policy/';
    privacyLink.textContent = 'Privacy Policy';
    bannerText.appendChild(privacyLink);
    bannerText.appendChild(document.createTextNode('.'));

    var actions     = document.createElement('div');
    actions.className = 'cookie-actions';

    var declineBtn     = document.createElement('button');
    declineBtn.className = 'cookie-btn cookie-btn-decline';
    declineBtn.setAttribute('type', 'button');
    declineBtn.setAttribute('data-cookie', 'declined');
    declineBtn.textContent = 'Decline';

    var acceptBtn     = document.createElement('button');
    acceptBtn.className = 'cookie-btn cookie-btn-accept';
    acceptBtn.setAttribute('type', 'button');
    acceptBtn.setAttribute('data-cookie', 'accepted');
    acceptBtn.textContent = 'Accept';

    actions.appendChild(declineBtn);
    actions.appendChild(acceptBtn);
    banner.appendChild(bannerText);
    banner.appendChild(actions);
    document.body.appendChild(banner);

    /* Event delegation for both buttons */
    banner.addEventListener('click', function (e) {
      var value = e.target.getAttribute('data-cookie');
      if (value) {
        localStorage.setItem(COOKIE_KEY, value);
        banner.remove();
      }
    });
  }


  /* ======================================================================
     4. SMOOTH SCROLL FOR ANCHOR LINKS
     ====================================================================== */

  document.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[href^="#"]');
    if (!anchor) { return; }

    var href = anchor.getAttribute('href');
    if (href === '#' || href.length < 2) { return; }

    var target = document.querySelector(href);
    if (!target) { return; }

    e.preventDefault();

    var offset = 80; /* Account for fixed nav */
    var top    = target.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({ top: top, behavior: 'smooth' });
    history.pushState(null, null, href);
  });


})();
