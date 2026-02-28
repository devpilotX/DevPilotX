/* ==========================================================================
   BEST PRACTICES — RESOURCE PAGE SCRIPTS
   Value.Codes | /resources/best-practices
   ========================================================================== */

(function () {
  'use strict';

  /* ========== TABLE OF CONTENTS — ACTIVE LINK TRACKING ========== */

  var tocLinks = document.querySelectorAll('.bp-toc-link');
  var sections = [];
  var tocActiveClass = 'bp-toc-active';

  /**
   * Build array of section targets for scroll tracking
   */
  function buildSectionMap() {
    sections = [];
    tocLinks.forEach(function (link) {
      var id = link.getAttribute('data-toc');
      if (id) {
        var el = document.getElementById(id);
        if (el) {
          sections.push({ id: id, el: el, link: link });
        }
      }
    });
  }

  /**
   * Highlight the TOC link corresponding to the currently visible section
   */
  function updateActiveToc() {
    var scrollY = window.pageYOffset;
    var offset = 120;
    var active = null;

    for (var i = sections.length - 1; i >= 0; i--) {
      if (scrollY >= sections[i].el.offsetTop - offset) {
        active = sections[i];
        break;
      }
    }

    tocLinks.forEach(function (link) {
      link.classList.remove(tocActiveClass);
    });

    if (active) {
      active.link.classList.add(tocActiveClass);
    }
  }

  if (tocLinks.length > 0) {
    buildSectionMap();

    var tocTicking = false;
    window.addEventListener('scroll', function () {
      if (!tocTicking) {
        requestAnimationFrame(function () {
          updateActiveToc();
          tocTicking = false;
        });
        tocTicking = true;
      }
    }, { passive: true });

    updateActiveToc();
  }

  /* ========== SMOOTH SCROLL FOR TOC LINKS ========== */

  tocLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || href.charAt(0) !== '#') return;

      var target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 90;
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.pushState(null, null, href);
    });
  });

  /* ========== SCROLL REVEAL FOR CARDS ========== */

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    document.querySelectorAll('.bp-card, .resource-card, .bp-summary-col').forEach(function (el) {
      el.classList.add('reveal-target');
      revealObserver.observe(el);
    });
  }

  /* ========== CHECKLIST TOGGLE (INTERACTIVE) ========== */

  var summaryItems = document.querySelectorAll('.bp-summary-list li');

  summaryItems.forEach(function (item) {
    item.setAttribute('role', 'checkbox');
    item.setAttribute('aria-checked', 'false');
    item.setAttribute('tabindex', '0');

    item.addEventListener('click', function () {
      toggleCheckItem(item);
    });

    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCheckItem(item);
      }
    });
  });

  /**
   * Toggle a checklist item's checked/unchecked state
   * @param {HTMLElement} item - The list item element
   */
  function toggleCheckItem(item) {
    var isChecked = item.getAttribute('aria-checked') === 'true';
    item.setAttribute('aria-checked', String(!isChecked));
    item.classList.toggle('bp-summary-checked');

    var svg = item.querySelector('svg');
    if (svg) {
      var rect = svg.querySelector('rect');
      if (rect && !isChecked) {
        svg.innerHTML = '<polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"></polyline>';
      } else if (!rect && isChecked) {
        svg.innerHTML = '<rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2.5" fill="none"></rect>';
      }
    }
  }

})();