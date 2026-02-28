/* ==========================================================================
   CAREER ROADMAPS — /resources/career-roadmaps
   Value.Codes — Self-assessment quiz, tab switching, scroll reveal
   ========================================================================== */

(function () {
  'use strict';

  /* ========== TAB SWITCHING ========== */
  var tabs = document.querySelectorAll('.roadmap-tab');
  var panels = document.querySelectorAll('.roadmap-panel');

  function activateTab(tabEl) {
    tabs.forEach(function (t) {
      t.classList.remove('roadmap-tab-active');
      t.setAttribute('aria-selected', 'false');
    });

    panels.forEach(function (p) {
      p.classList.remove('roadmap-panel-active');
      p.setAttribute('hidden', '');
    });

    tabEl.classList.add('roadmap-tab-active');
    tabEl.setAttribute('aria-selected', 'true');

    var panelId = tabEl.getAttribute('aria-controls');
    var panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('roadmap-panel-active');
      panel.removeAttribute('hidden');
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activateTab(tab);
    });
  });

  /* ========== TAB KEYBOARD NAVIGATION ========== */
  var tabList = document.querySelector('.roadmap-tabs');
  if (tabList) {
    tabList.addEventListener('keydown', function (e) {
      var tabsArr = Array.from(tabs);
      var currentIndex = tabsArr.indexOf(document.activeElement);
      if (currentIndex === -1) return;

      var newIndex = -1;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        newIndex = (currentIndex + 1) % tabsArr.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        newIndex = (currentIndex - 1 + tabsArr.length) % tabsArr.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newIndex = tabsArr.length - 1;
      }

      if (newIndex !== -1) {
        tabsArr[newIndex].focus();
        activateTab(tabsArr[newIndex]);
      }
    });
  }

  /* ========== SELF-ASSESSMENT QUIZ ========== */
  var scores = {
    frontend: 0,
    backend: 0,
    fullstack: 0,
    devops: 0,
    datascience: 0,
    mobile: 0
  };

  var pathLabels = {
    frontend: 'Frontend',
    backend: 'Backend',
    fullstack: 'Full Stack',
    devops: 'DevOps',
    datascience: 'Data Science',
    mobile: 'Mobile'
  };

  var questions = document.querySelectorAll('.assessment-question');
  var resultContainer = document.getElementById('assessment-result');
  var resultContent = document.getElementById('result-content');
  var resultPlaceholder = resultContainer ? resultContainer.querySelector('.result-placeholder') : null;
  var resultBars = document.getElementById('result-bars');
  var totalQuestions = questions.length;
  var answeredQuestions = 0;

  questions.forEach(function (question) {
    var options = question.querySelectorAll('.question-option');

    options.forEach(function (option) {
      option.addEventListener('click', function () {
        var wasSelected = option.classList.contains('question-option-selected');
        var previouslySelected = question.querySelector('.question-option-selected');

        /* Remove previous selection for this question */
        if (previouslySelected) {
          previouslySelected.classList.remove('question-option-selected');
          previouslySelected.setAttribute('aria-pressed', 'false');
          var prevPaths = previouslySelected.getAttribute('data-paths').split(',');
          prevPaths.forEach(function (p) {
            if (scores[p] !== undefined) scores[p]--;
          });
          if (previouslySelected === option) {
            answeredQuestions--;
            updateResults();
            return;
          }
        }

        /* Select current option */
        if (!wasSelected) {
          option.classList.add('question-option-selected');
          option.setAttribute('aria-pressed', 'true');
          var paths = option.getAttribute('data-paths').split(',');
          paths.forEach(function (p) {
            if (scores[p] !== undefined) scores[p]++;
          });
          if (!previouslySelected) answeredQuestions++;
        }

        updateResults();
      });
    });
  });

  function updateResults() {
    if (!resultContainer || !resultContent || !resultBars || !resultPlaceholder) return;

    if (answeredQuestions === 0) {
      resultPlaceholder.classList.remove('d-none');
      resultContent.classList.remove('result-content-visible');
      return;
    }

    resultPlaceholder.classList.add('d-none');
    resultContent.classList.add('result-content-visible');

    /* Calculate max score */
    var maxScore = 0;
    Object.keys(scores).forEach(function (key) {
      if (scores[key] > maxScore) maxScore = scores[key];
    });
    if (maxScore === 0) maxScore = 1;

    /* Sort paths by score */
    var sorted = Object.keys(scores).sort(function (a, b) {
      return scores[b] - scores[a];
    });

    /* Build bars */
    resultBars.innerHTML = '';
    sorted.forEach(function (key) {
      var pct = Math.round((scores[key] / totalQuestions) * 100);
      var widthPct = Math.round((scores[key] / maxScore) * 100);

      var item = document.createElement('div');
      item.className = 'result-bar-item';

      var label = document.createElement('span');
      label.className = 'result-bar-label';
      label.textContent = pathLabels[key];

      var track = document.createElement('div');
      track.className = 'result-bar-track';

      var fill = document.createElement('div');
      fill.className = 'result-bar-fill';
      if (scores[key] === maxScore && scores[key] > 0) {
        fill.classList.add('result-bar-fill-top');
      }
      fill.style.width = '0%';

      var pctLabel = document.createElement('span');
      pctLabel.className = 'result-bar-pct';
      pctLabel.textContent = pct + '%';

      track.appendChild(fill);
      item.appendChild(label);
      item.appendChild(track);
      item.appendChild(pctLabel);
      resultBars.appendChild(item);

      /* Animate bar width */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          fill.style.width = widthPct + '%';
        });
      });
    });
  }

  /* ========== MATRIX SCROLL HINT ========== */
  var matrixContainer = document.querySelector('.matrix-table-container');
  var scrollHint = document.getElementById('matrix-scroll-hint');

  function checkMatrixScroll() {
    if (!matrixContainer || !scrollHint) return;
    if (matrixContainer.scrollWidth > matrixContainer.clientWidth) {
      scrollHint.classList.add('matrix-scroll-hint-visible');
    } else {
      scrollHint.classList.remove('matrix-scroll-hint-visible');
    }
  }

  if (matrixContainer && scrollHint) {
    checkMatrixScroll();
    window.addEventListener('resize', checkMatrixScroll, { passive: true });

    matrixContainer.addEventListener('scroll', function () {
      if (matrixContainer.scrollLeft > 10) {
        scrollHint.classList.add('d-none');
      }
    }, { passive: true });
  }

  /* ========== SCROLL REVEAL ========== */
  if ('IntersectionObserver' in window) {
    var revealTargets = document.querySelectorAll(
      '.roadmap-block, .comparison-card, .project-card, .skill-level, ' +
      '.timeline-item, .daily-item, .salary-card, .resource-link-card, .resource-card'
    );

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -30px 0px'
    });

    revealTargets.forEach(function (el) {
      el.classList.add('reveal-target');
      observer.observe(el);
    });
  }

  /* ========== SMOOTH SCROLL FOR INTERNAL LINKS ========== */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href');
      if (!href || href.length < 2) return;
      var target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      var offset = target.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
      history.pushState(null, null, href);
    });
  });

  /* ========== LINK TABS TO ASSESSMENT RESULTS ========== */
  /* If URL has hash matching a tab, activate it */
  var hash = window.location.hash;
  if (hash) {
    var matchingTab = document.querySelector('.roadmap-tab[data-tab="' + hash.replace('#', '') + '"]');
    if (matchingTab) {
      activateTab(matchingTab);
      var panelEl = document.getElementById('panel-' + hash.replace('#', ''));
      if (panelEl) {
        requestAnimationFrame(function () {
          panelEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
  }

})();