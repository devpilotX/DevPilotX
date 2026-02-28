/**
 * contribute.js — Client-side logic for the Contribute page
 * Page: /contribute
 * Value.Codes
 */
(function () {
  'use strict';

  /* ========== COPY TO CLIPBOARD ========== */
  function initCopyButtons() {
    var buttons = document.querySelectorAll('.contribute-copy-btn');
    if (!buttons.length) return;

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var textToCopy = btn.getAttribute('data-copy');
        if (!textToCopy) return;

        /* Decode HTML entities that may be in data attribute */
        var decoded = textToCopy.replace(/&#10;/g, '\\n').replace(/&quot;/g, '"').replace(/&amp;/g, '&');

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(decoded).then(function () {
            showCopiedState(btn);
          });
        } else {
          /* Fallback for older browsers */
          var textarea = document.createElement('textarea');
          textarea.value = decoded;
          textarea.setAttribute('readonly', '');
          textarea.setAttribute('aria-hidden', 'true');
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          showCopiedState(btn);
        }
      });
    });
  }

  /**
   * Show visual feedback when text is copied
   * @param {HTMLElement} btn - The copy button element
   */
  function showCopiedState(btn) {
    btn.classList.add('is-copied');
    btn.setAttribute('aria-label', 'Copied!');

    setTimeout(function () {
      btn.classList.remove('is-copied');
      /* Restore original aria-label */
      var originalLabel = btn.closest('.contribute-step__code')
        ? 'Copy code'
        : 'Copy';
      btn.setAttribute('aria-label', originalLabel);
    }, 2000);
  }

  /* ========== SMOOTH SCROLL FOR ANCHOR LINKS ========== */
  function initSmoothScroll() {
    var anchors = document.querySelectorAll('a[href^="#"]');
    anchors.forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = anchor.getAttribute('href');
        if (targetId === '#') return;

        var target = document.querySelector(targetId);
        if (!target) return;

        e.preventDefault();
        var navHeight = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
          10
        ) || 62;

        var top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
        window.scrollTo({ top: top, behavior: 'smooth' });

        /* Update URL hash without jumping */
        if (history.pushState) {
          history.pushState(null, null, targetId);
        }
      });
    });
  }

  /* ========== ANIMATE STATS ON SCROLL ========== */
  function initStatCounters() {
    var stats = document.querySelectorAll('.contribute-stat__number');
    if (!stats.length) return;

    var hasAnimated = false;

    function animateCounters() {
      if (hasAnimated) return;

      var firstStat = stats[0];
      var rect = firstStat.getBoundingClientRect();
      var windowHeight = window.innerHeight || document.documentElement.clientHeight;

      if (rect.top < windowHeight * 0.85) {
        hasAnimated = true;
        stats.forEach(function (stat) {
          var text = stat.textContent.trim();
          /* Parse number — handle k suffix */
          var hasK = text.indexOf('k') !== -1;
          var num = parseFloat(text.replace('k', '').replace(',', ''));
          var target = hasK ? num : parseInt(text.replace(',', ''), 10);

          animateNumber(stat, 0, target, hasK, 1200);
        });
      }
    }

    /**
     * Animate a number from start to end
     * @param {HTMLElement} el - The element to update
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {boolean} hasK - Whether to append 'k' suffix
     * @param {number} duration - Animation duration in ms
     */
    function animateNumber(el, start, end, hasK, duration) {
      var startTime = null;

      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        var progress = Math.min((timestamp - startTime) / duration, 1);
        /* Ease out cubic */
        var eased = 1 - Math.pow(1 - progress, 3);
        var current = start + (end - start) * eased;

        if (hasK) {
          el.textContent = current.toFixed(1) + 'k';
        } else {
          el.textContent = Math.round(current).toLocaleString();
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    }

    /* Check on load */
    animateCounters();

    /* Check on scroll */
    window.addEventListener('scroll', animateCounters, { passive: true });
  }

  /* ========== INTERSECTION OBSERVER FOR SECTION ANIMATIONS ========== */
  function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    var sections = document.querySelectorAll(
      '.contribute-why__card, .contribute-step, .contribute-area, .contribute-guideline, .contribute-issue, .contribute-contributor'
    );

    /* Add initial hidden class */
    sections.forEach(function (section) {
      section.classList.add('contribute-fade-in');
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('contribute-fade-in--visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ========== FETCH LIVE STATS ========== */
  async function loadLiveStats() {
    try {
      var response = await fetch('/api/github-stats');
      var data = await response.json();
      if (data.success) {
        var starsEl = document.getElementById('stat-stars');
        var forksEl = document.getElementById('stat-forks');
        if (starsEl) starsEl.textContent = data.stats.stars;
        if (forksEl) forksEl.textContent = data.stats.forks;
        initStatCounters();
      } else {
        initStatCounters();
      }
    } catch (err) {
      initStatCounters();
    }
  }

  /* ========== FETCH LIVE ISSUES ========== */
  async function loadLiveIssues() {
    try {
      var response = await fetch('/api/github-issues');
      var data = await response.json();
      if (data.success && data.issues.length > 0) {
        var issuesContainer = document.getElementById('issues-list');
        if (!issuesContainer) return;
        issuesContainer.innerHTML = '';
        data.issues.forEach(function (issue) {
          issuesContainer.insertAdjacentHTML('beforeend',
            '<div class="contribute-issue">' +
              '<div class="contribute-issue__status contribute-issue__status--open">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle></svg>' +
              '</div>' +
              '<div class="contribute-issue__body">' +
                '<h3><a href="' + issue.html_url + '" target="_blank" rel="noopener">' + issue.title + '</a></h3>' +
                '<div class="contribute-issue__meta"><span class="tag tag--green">good first issue</span></div>' +
              '</div>' +
            '</div>'
          );
        });
      }
    } catch (err) {
      /* silently fail — static fallback content remains */
    }
  }

  /* ========== INIT ========== */
  document.addEventListener('DOMContentLoaded', function () {
    initCopyButtons();
    initSmoothScroll();
    loadLiveStats();
    loadLiveIssues();
    initScrollAnimations();
  });
})();