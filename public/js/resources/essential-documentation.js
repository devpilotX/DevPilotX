/**
 * resources.js — Client-side search/filter for the Documentation Directory page
 * Value.Codes — /resources
 */
(function () {
  'use strict';

  /* ========== DOM REFERENCES ========== */
  var searchInput = document.getElementById('resources-search');
  var categories = document.querySelectorAll('.resources-category');
  var allCards = document.querySelectorAll('.resource-card');
  var noResults = document.querySelector('.resources-no-results');
  var nonFilterSections = document.querySelectorAll(
    '.resources-referenced, .resources-tips, .resources-related'
  );

  if (!searchInput || !allCards.length) return;

  /* ========== DEBOUNCE UTILITY ========== */
  var debounceTimer;
  function debounce(fn, delay) {
    return function () {
      var args = arguments;
      var context = this;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  /* ========== SEARCH HANDLER ========== */
  function handleSearch() {
    var query = searchInput.value.trim().toLowerCase();

    /* If empty, show everything */
    if (!query) {
      resetView();
      return;
    }

    var visibleCount = 0;

    /* Filter individual cards */
    allCards.forEach(function (card) {
      var searchData = (card.getAttribute('data-search') || '').toLowerCase();
      var title = (card.querySelector('.resource-card__title') || {}).textContent || '';
      var desc = (card.querySelector('.resource-card__desc') || {}).textContent || '';
      var combined = searchData + ' ' + title.toLowerCase() + ' ' + desc.toLowerCase();

      if (combined.indexOf(query) !== -1) {
        card.classList.remove('resource-card--hidden');
        visibleCount++;
      } else {
        card.classList.add('resource-card--hidden');
      }
    });

    /* Hide/show category sections based on whether they have visible cards */
    categories.forEach(function (section) {
      var cards = section.querySelectorAll('.resource-card');
      var hasVisible = false;
      cards.forEach(function (card) {
        if (!card.classList.contains('resource-card--hidden')) {
          hasVisible = true;
        }
      });
      if (hasVisible) {
        section.classList.remove('resources-category--hidden');
      } else {
        section.classList.add('resources-category--hidden');
      }
    });

    /* Hide non-filterable sections during search */
    nonFilterSections.forEach(function (section) {
      section.classList.add('resources-category--hidden');
    });

    /* Show/hide no results message */
    if (noResults) {
      if (visibleCount === 0) {
        noResults.removeAttribute('hidden');
      } else {
        noResults.setAttribute('hidden', '');
      }
    }
  }

  /* ========== RESET VIEW ========== */
  function resetView() {
    allCards.forEach(function (card) {
      card.classList.remove('resource-card--hidden');
    });
    categories.forEach(function (section) {
      section.classList.remove('resources-category--hidden');
    });
    nonFilterSections.forEach(function (section) {
      section.classList.remove('resources-category--hidden');
    });
    if (noResults) {
      noResults.setAttribute('hidden', '');
    }
  }

  /* ========== EVENT LISTENERS ========== */
  searchInput.addEventListener('input', debounce(handleSearch, 200));

  /* Clear on Escape key */
  searchInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      searchInput.value = '';
      resetView();
      searchInput.blur();
    }
  });

})();