/**
 * FILE: public/js/snippet-single.js
 * PURPOSE: Tab switching + copy-to-clipboard for single snippet page
 */

'use strict';

/* ========== TAB SWITCHING ========== */

(function () {
  var tabButtons = document.querySelectorAll('.snippet-tab-btn');
  var tabPanels = document.querySelectorAll('.snippet-tab-panel');

  if (tabButtons.length === 0) return;

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetIdx = btn.dataset.tabIndex;

      /* Deactivate all tabs */
      tabButtons.forEach(function (b) {
        b.classList.remove('snippet-tab-active');
        b.setAttribute('aria-selected', 'false');
      });

      /* Hide all panels */
      tabPanels.forEach(function (panel) {
        panel.classList.remove('snippet-panel-active');
        panel.setAttribute('hidden', '');
      });

      /* Activate clicked tab */
      btn.classList.add('snippet-tab-active');
      btn.setAttribute('aria-selected', 'true');

      /* Show matching panel */
      var panel = document.getElementById('snippet-panel-' + targetIdx);
      if (panel) {
        panel.classList.add('snippet-panel-active');
        panel.removeAttribute('hidden');
      }
    });
  });
})();

/* ========== COPY TO CLIPBOARD ========== */

(function () {
  document.querySelectorAll('.snippet-copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.dataset.copyTarget;
      var codeEl = document.getElementById(targetId);
      if (!codeEl) return;

      var text = codeEl.textContent || codeEl.innerText || '';

      navigator.clipboard.writeText(text).then(function () {
        var textEl = btn.querySelector('.snippet-copy-text');
        var originalText = textEl ? textEl.textContent : 'Copy';

        btn.classList.add('copied');
        if (textEl) textEl.textContent = 'Copied!';

        setTimeout(function () {
          btn.classList.remove('copied');
          if (textEl) textEl.textContent = originalText;
        }, 2000);
      }).catch(function () { /* clipboard unavailable */ });
    });
  });
})();
