/**
 * ================================================================
 * FILE: public/js/apis.js
 * PURPOSE: Client-side search & filter on /apis page
 * ================================================================
 */

(function () {
  'use strict';

  var searchInput = document.getElementById('api-search-input');
  var apiGrid = document.getElementById('api-grid');
  var noResults = document.getElementById('api-no-results');

  if (!searchInput || !apiGrid) return;

  var cards = apiGrid.querySelectorAll('.api-card');
  var debounceTimer;

  function filterCards() {
    var query = searchInput.value.toLowerCase().trim();
    var visibleCount = 0;

    cards.forEach(function (card) {
      var name = card.getAttribute('data-name') || '';
      var desc = card.getAttribute('data-description') || '';
      var category = card.getAttribute('data-category') || '';
      var tags = card.getAttribute('data-tags') || '';

      var searchableText = name + ' ' + desc + ' ' + category + ' ' + tags;

      if (!query || searchableText.indexOf(query) !== -1) {
        card.classList.remove('is-hidden');
        visibleCount++;
      } else {
        card.classList.add('is-hidden');
      }
    });

    if (noResults) {
      noResults.hidden = visibleCount > 0;
    }
  }

  searchInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(filterCards, 200);
  });

  /* Focus search on / key */
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      searchInput.focus();
    }
  });

})();
