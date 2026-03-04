/* ==========================================================================
   TOOLS — Listing Page Script
   Value.Codes | /tools
   ========================================================================== */

(function () {
  'use strict';

  /* ========== CATEGORY FILTER ========== */

  var filterBtns = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.tool-card');
  var countEl = document.getElementById('tools-count');
  var emptyEl = document.getElementById('tools-empty');

  function updateCount(visible) {
    if (countEl) {
      countEl.innerHTML = 'Showing <strong>' + visible + '</strong> tool' + (visible !== 1 ? 's' : '');
    }
    if (emptyEl) {
      emptyEl.classList.toggle('visible', visible === 0);
    }
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      filterBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      var visible = 0;
      cards.forEach(function (card) {
        var cat = card.getAttribute('data-category');
        var show = filter === 'all' || cat === filter;
        card.classList.toggle('is-hidden', !show);
        if (show) visible++;
      });

      updateCount(visible);
    });
  });

})();
