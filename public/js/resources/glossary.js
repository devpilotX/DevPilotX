/**
 * glossary.js
 * Handles search, alphabet navigation, category filtering,
 * and interactive features for the Programming Glossary page.
 */
(function () {
  'use strict';

  /* ========== DOM REFERENCES ========== */
  var searchInput = document.getElementById('glossary-search');
  var searchClear = document.getElementById('glossary-search-clear');
  var searchCount = document.getElementById('glossary-search-count');
  var noResults = document.getElementById('glossary-no-results');
  var resetBtn = document.getElementById('glossary-reset-btn');
  var alphaBtns = document.querySelectorAll('.glossary-alpha-btn');
  var categoryChips = document.querySelectorAll('.glossary-chip');
  var letterGroups = document.querySelectorAll('.glossary-letter-group');
  var termCards = document.querySelectorAll('.glossary-term-card');

  /* ========== STATE ========== */
  var currentLetter = 'all';
  var currentCategory = 'all';
  var currentSearch = '';

  /* ========== FILTER LOGIC ========== */
  function filterTerms() {
    var visibleCount = 0;
    var visibleGroups = {};

    termCards.forEach(function (card) {
      var term = card.getAttribute('data-term') || '';
      var category = card.getAttribute('data-category') || '';
      var termName = card.querySelector('.glossary-term-name');
      var termText = termName ? termName.textContent.toLowerCase() : '';
      var defEl = card.querySelector('.glossary-term-def');
      var defText = defEl ? defEl.textContent.toLowerCase() : '';

      /* Check search match */
      var searchMatch = true;
      if (currentSearch) {
        searchMatch = termText.indexOf(currentSearch) !== -1 ||
                      defText.indexOf(currentSearch) !== -1 ||
                      term.indexOf(currentSearch) !== -1;
      }

      /* Check letter match */
      var letterMatch = true;
      if (currentLetter !== 'all') {
        var firstChar = termText.charAt(0).toUpperCase();
        letterMatch = firstChar === currentLetter;
      }

      /* Check category match */
      var categoryMatch = true;
      if (currentCategory !== 'all') {
        categoryMatch = category === currentCategory;
      }

      /* Apply visibility */
      var isVisible = searchMatch && letterMatch && categoryMatch;
      if (isVisible) {
        card.classList.remove('hidden');
        visibleCount++;
        /* Track which letter groups have visible cards */
        var group = card.closest('.glossary-letter-group');
        if (group) {
          var groupLetter = group.getAttribute('data-letter-group');
          visibleGroups[groupLetter] = true;
        }
      } else {
        card.classList.add('hidden');
      }
    });

    /* Show/hide letter groups based on visible cards */
    letterGroups.forEach(function (group) {
      var groupLetter = group.getAttribute('data-letter-group');
      if (visibleGroups[groupLetter]) {
        group.classList.remove('hidden');
      } else {
        group.classList.add('hidden');
      }
    });

    /* Update count display */
    if (currentSearch || currentCategory !== 'all' || currentLetter !== 'all') {
      searchCount.textContent = visibleCount + ' term' + (visibleCount !== 1 ? 's' : '') + ' found';
    } else {
      searchCount.textContent = '';
    }

    /* Show/hide no results */
    if (visibleCount === 0) {
      noResults.classList.remove('hidden');
    } else {
      noResults.classList.add('hidden');
    }

    /* Update alphabet button states */
    alphaBtns.forEach(function (btn) {
      var letter = btn.getAttribute('data-letter');
      if (letter === 'all') return;
      /* Check if any terms exist for this letter given current filters */
      var hasTerms = false;
      termCards.forEach(function (card) {
        var termName = card.querySelector('.glossary-term-name');
        var firstChar = termName ? termName.textContent.charAt(0).toUpperCase() : '';
        var category = card.getAttribute('data-category') || '';
        var termText = termName ? termName.textContent.toLowerCase() : '';
        var defEl = card.querySelector('.glossary-term-def');
        var defText = defEl ? defEl.textContent.toLowerCase() : '';

        var catMatch = currentCategory === 'all' || category === currentCategory;
        var searchMatch2 = !currentSearch ||
                           termText.indexOf(currentSearch) !== -1 ||
                           defText.indexOf(currentSearch) !== -1;

        if (firstChar === letter && catMatch && searchMatch2) {
          hasTerms = true;
        }
      });

      if (hasTerms) {
        btn.classList.remove('disabled');
      } else {
        btn.classList.add('disabled');
      }
    });
  }

  /* ========== SEARCH HANDLER ========== */
  searchInput.addEventListener('input', function () {
    currentSearch = searchInput.value.toLowerCase().trim();
    if (currentSearch) {
      searchClear.classList.remove('hidden');
    } else {
      searchClear.classList.add('hidden');
    }
    filterTerms();
  });

  searchClear.addEventListener('click', function () {
    searchInput.value = '';
    currentSearch = '';
    searchClear.classList.add('hidden');
    searchInput.focus();
    filterTerms();
  });

  /* ========== ALPHABET NAVIGATION ========== */
  alphaBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var letter = btn.getAttribute('data-letter');

      /* Don't do anything if disabled */
      if (btn.classList.contains('disabled')) return;

      currentLetter = letter;

      /* Update active state */
      alphaBtns.forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');

      filterTerms();

      /* Scroll to letter group if specific letter */
      if (letter !== 'all') {
        var targetGroup = document.getElementById('letter-' + letter);
        if (targetGroup && !targetGroup.classList.contains('hidden')) {
          var navHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 62;
          var offset = navHeight + 80;
          var targetTop = targetGroup.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
      }
    });
  });

  /* ========== CATEGORY FILTERS ========== */
  categoryChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      currentCategory = chip.getAttribute('data-category');

      /* Update active state */
      categoryChips.forEach(function (c) {
        c.classList.remove('active');
      });
      chip.classList.add('active');

      filterTerms();
    });
  });

  /* ========== RESET BUTTON ========== */
  resetBtn.addEventListener('click', function () {
    /* Reset search */
    searchInput.value = '';
    currentSearch = '';
    searchClear.classList.add('hidden');

    /* Reset letter */
    currentLetter = 'all';
    alphaBtns.forEach(function (b) {
      b.classList.remove('active');
    });
    document.querySelector('.glossary-alpha-btn-all').classList.add('active');

    /* Reset category */
    currentCategory = 'all';
    categoryChips.forEach(function (c) {
      c.classList.remove('active');
    });
    document.querySelector('.glossary-chip[data-category="all"]').classList.add('active');

    filterTerms();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ========== KEYBOARD SHORTCUTS ========== */
  document.addEventListener('keydown', function (e) {
    /* Press / to focus search (when not already in an input) */
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      searchInput.focus();
    }

    /* Escape to clear search when focused */
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.value = '';
      currentSearch = '';
      searchClear.classList.add('hidden');
      searchInput.blur();
      filterTerms();
    }
  });

  /* ========== INITIALIZE ========== */
  filterTerms();

})();