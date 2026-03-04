/**
 * FILE: public/js/snippets.js
 * PURPOSE: Snippets index and category page interactions
 */

'use strict';

/* Snippet category cards — keyboard accessibility */
document.querySelectorAll('.snippet-category-card, .snippet-list-item').forEach(function (el) {
  el.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.click();
    }
  });
});
