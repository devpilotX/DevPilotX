/**
 * ==========================================================================
 * Value.Codes — Header Scripts
 * ==========================================================================
 *
 * Handles:
 *   1. Mobile hamburger menu toggle
 *   2. Profile dropdown open/close (for logged-in users)
 *   3. Active nav link highlighting
 *   4. Keyboard (Escape) and outside-click dismiss for all overlays
 *
 * Rules:
 *   - Zero inline JS in HTML
 *   - All state changes via CSS class toggling
 *   - aria-expanded / aria-hidden properly managed
 *
 * @version  2.0.0
 * @license  MIT
 * ==========================================================================
 */

(function () {
  'use strict';


  /* ======================================================================
     1. MOBILE HAMBURGER MENU
     ====================================================================== */

  var menuToggle = document.getElementById('menu-toggle');
  var navInner   = menuToggle ? menuToggle.closest('.nav-inner') : null;

  if (menuToggle && navInner) {

    menuToggle.addEventListener('click', function () {
      var isOpen = navInner.classList.toggle('nav-open');
      menuToggle.classList.toggle('menu-toggle-active', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (!navInner.contains(e.target) && navInner.classList.contains('nav-open')) {
        navInner.classList.remove('nav-open');
        menuToggle.classList.remove('menu-toggle-active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    /* Close on Escape key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navInner.classList.contains('nav-open')) {
        navInner.classList.remove('nav-open');
        menuToggle.classList.remove('menu-toggle-active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
    });
  }


  /* ======================================================================
     2. PROFILE DROPDOWN (Logged-In State)
     ====================================================================== */

  var profileToggle   = document.getElementById('nav-profile-toggle');
  var profileDropdown = document.getElementById('nav-profile-dropdown');

  if (profileToggle && profileDropdown) {

    profileToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = profileDropdown.classList.toggle('open');
      profileToggle.classList.toggle('nav-profile-btn-expanded', isOpen);
      profileToggle.setAttribute('aria-expanded', String(isOpen));
      profileDropdown.setAttribute('aria-hidden', String(!isOpen));
    });

    /* Close on outside click */
    document.addEventListener('click', function (e) {
      if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('open');
        profileToggle.classList.remove('nav-profile-btn-expanded');
        profileToggle.setAttribute('aria-expanded', 'false');
        profileDropdown.setAttribute('aria-hidden', 'true');
      }
    });

    /* Close on Escape key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && profileDropdown.classList.contains('open')) {
        profileDropdown.classList.remove('open');
        profileToggle.classList.remove('nav-profile-btn-expanded');
        profileToggle.setAttribute('aria-expanded', 'false');
        profileDropdown.setAttribute('aria-hidden', 'true');
        profileToggle.focus();
      }
    });
  }


  /* ======================================================================
     3. ACTIVE NAV LINK HIGHLIGHTING
     ====================================================================== */

  var currentPath = window.location.pathname;
  var navLinks    = document.querySelectorAll('.nav-link');

  navLinks.forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href) { return; }

    if (href === '/' && currentPath === '/') {
      link.classList.add('active');
    } else if (href !== '/' && currentPath.indexOf(href) === 0) {
      link.classList.add('active');
    }
  });


})();
