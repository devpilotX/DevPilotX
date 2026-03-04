/**
 * ================================================================
 * FILE: public/js/admin/snippets.js
 * PURPOSE: Dynamic tab builder, auto-slug generation, delete confirm
 * ================================================================
 */

(function () {
  'use strict';

  /* ========== AUTO-GENERATE SLUG FROM TITLE ========== */
  var titleInput = document.getElementById('title');
  var slugInput = document.getElementById('slug');

  if (titleInput && slugInput) {
    titleInput.addEventListener('input', function () {
      /* Only auto-generate if slug is empty or was auto-generated */
      if (!slugInput.dataset.manual) {
        slugInput.value = titleInput.value
          .toLowerCase()
          .replace(/[^a-z0-9\\s-]/g, '')
          .replace(/\\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
    });

    /* Mark slug as manually edited if user types in it */
    slugInput.addEventListener('input', function () {
      slugInput.dataset.manual = '1';
    });
  }

  /* ========== DYNAMIC TAB BUILDER ========== */
  var tabsContainer = document.getElementById('tabs-container');
  var addTabBtn = document.getElementById('add-tab-btn');

  if (addTabBtn && tabsContainer) {
    addTabBtn.addEventListener('click', function () {
      var tabCount = tabsContainer.querySelectorAll('.admin-tab-block').length;
      var idx = tabCount;

      var languages = [
        'css', 'html', 'javascript', 'typescript', 'jsx',
        'json', 'bash', 'yaml', 'dockerfile', 'nginx', 'sql'
      ];

      var optionsHtml = languages.map(function (lang) {
        return '<option value="' + lang + '">' + lang + '</option>';
      }).join('');

      var tabHtml = '' +
        '<div class="admin-tab-block" data-tab-index="' + idx + '">' +
          '<div class="admin-tab-header">' +
            '<strong>Tab ' + (idx + 1) + '</strong>' +
            '<button type="button" class="btn btn-sm btn-ghost admin-remove-tab-btn" data-tab-index="' + idx + '" aria-label="Remove this tab">✕</button>' +
          '</div>' +
          '<div class="admin-field-row">' +
            '<div class="admin-field">' +
              '<label for="tab_label_' + idx + '">Tab Label *</label>' +
              '<input type="text" id="tab_label_' + idx + '" name="tab_label_' + idx + '" required placeholder="e.g., CSS Method">' +
            '</div>' +
            '<div class="admin-field">' +
              '<label for="tab_language_' + idx + '">Language *</label>' +
              '<select id="tab_language_' + idx + '" name="tab_language_' + idx + '" required>' + optionsHtml + '</select>' +
            '</div>' +
            '<div class="admin-field">' +
              '<label for="tab_file_name_' + idx + '">File Name</label>' +
              '<input type="text" id="tab_file_name_' + idx + '" name="tab_file_name_' + idx + '" placeholder="e.g., style.css">' +
            '</div>' +
          '</div>' +
          '<div class="admin-field">' +
            '<label for="tab_code_' + idx + '">Code *</label>' +
            '<textarea id="tab_code_' + idx + '" name="tab_code_' + idx + '" rows="12" required class="admin-code-textarea" placeholder="Paste your code here..." spellcheck="false"></textarea>' +
          '</div>' +
        '</div>';

      var temp = document.createElement('div');
      temp.innerHTML = tabHtml;
      tabsContainer.appendChild(temp.firstChild);
    });

    /* Remove tab (event delegation) */
    tabsContainer.addEventListener('click', function (e) {
      var removeBtn = e.target.closest('.admin-remove-tab-btn');
      if (!removeBtn) return;

      var tabBlock = removeBtn.closest('.admin-tab-block');
      if (tabBlock && tabsContainer.querySelectorAll('.admin-tab-block').length > 1) {
        tabBlock.remove();
        reindexTabs();
      }
    });
  }

  /**
   * Reindex tab form field names after removal
   */
  function reindexTabs() {
    var blocks = tabsContainer.querySelectorAll('.admin-tab-block');
    blocks.forEach(function (block, idx) {
      block.setAttribute('data-tab-index', idx);
      block.querySelector('.admin-tab-header strong').textContent = 'Tab ' + (idx + 1);

      var fields = ['label', 'language', 'file_name', 'code'];
      fields.forEach(function (field) {
        var el = block.querySelector('[name^="tab_' + field + '"]');
        if (el) {
          el.name = 'tab_' + field + '_' + idx;
          el.id = 'tab_' + field + '_' + idx;
        }
        var label = block.querySelector('label[for^="tab_' + field + '"]');
        if (label) {
          label.setAttribute('for', 'tab_' + field + '_' + idx);
        }
      });

      var removeBtn = block.querySelector('.admin-remove-tab-btn');
      if (removeBtn) {
        removeBtn.setAttribute('data-tab-index', idx);
      }
    });
  }

  /* ========== DELETE CONFIRMATION ========== */
  var deleteForms = document.querySelectorAll('.admin-delete-form');
  deleteForms.forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var confirmed = window.confirm('Are you sure you want to delete this snippet? This cannot be undone.');
      if (!confirmed) {
        e.preventDefault();
      }
    });
  });

})();