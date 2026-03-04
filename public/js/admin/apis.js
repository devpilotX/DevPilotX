/**
 * ================================================================
 * FILE: public/js/admin/apis.js
 * PURPOSE: Admin form JS — auto-slug, dynamic endpoints, delete confirm
 * ================================================================
 */

(function () {
  'use strict';

  /* ========== AUTO SLUG ========== */
  var nameInput = document.getElementById('name');
  var slugInput = document.getElementById('slug');

  if (nameInput && slugInput) {
    nameInput.addEventListener('input', function () {
      if (!slugInput.dataset.manual) {
        slugInput.value = nameInput.value
          .toLowerCase()
          .replace(/[^a-z0-9\\s-]/g, '')
          .replace(/\\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }
    });
    slugInput.addEventListener('input', function () {
      slugInput.dataset.manual = '1';
    });
  }

  /* ========== DYNAMIC ENDPOINTS ========== */
  var epContainer = document.getElementById('endpoints-container');
  var addEpBtn = document.getElementById('add-endpoint-btn');

  if (addEpBtn && epContainer) {
    addEpBtn.addEventListener('click', function () {
      var idx = epContainer.querySelectorAll('.admin-endpoint-block').length;

      var methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      var optionsHtml = methods.map(function (m) {
        return '<option value="' + m + '">' + m + '</option>';
      }).join('');

      var html = '' +
        '<div class="admin-endpoint-block" data-ep-index="' + idx + '">' +
          '<div class="admin-field-row">' +
            '<div class="admin-field" style="max-width: 100px;">' +
              '<select name="endpoint_method_' + idx + '">' + optionsHtml + '</select>' +
            '</div>' +
            '<div class="admin-field">' +
              '<input type="text" name="endpoint_path_' + idx + '" placeholder="/v1/endpoint">' +
            '</div>' +
            '<div class="admin-field">' +
              '<input type="text" name="endpoint_desc_' + idx + '" placeholder="Description">' +
            '</div>' +
            '<button type="button" class="btn btn-sm btn-ghost admin-remove-ep-btn" aria-label="Remove">✕</button>' +
          '</div>' +
        '</div>';

      var temp = document.createElement('div');
      temp.innerHTML = html;
      epContainer.appendChild(temp.firstChild);
    });

    epContainer.addEventListener('click', function (e) {
      var btn = e.target.closest('.admin-remove-ep-btn');
      if (!btn) return;
      var block = btn.closest('.admin-endpoint-block');
      if (block) block.remove();
    });
  }

  /* ========== DELETE CONFIRM ========== */
  document.querySelectorAll('.admin-delete-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!window.confirm('Delete this API? This cannot be undone.')) {
        e.preventDefault();
      }
    });
  });

})();