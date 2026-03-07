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
  function copyText(text, btn) {
    var textEl = btn.querySelector('.snippet-copy-text');

    function onSuccess() {
      btn.classList.add('copied');
      if (textEl) textEl.textContent = 'Copied!';
      setTimeout(function () {
        btn.classList.remove('copied');
        if (textEl) textEl.textContent = 'Copy';
      }, 2000);
    }

    /* Modern clipboard API (requires HTTPS or localhost) */
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(function () {
        execCommandFallback(text, onSuccess);
      });
    } else {
      execCommandFallback(text, onSuccess);
    }
  }

  /* Fallback for HTTP or older browsers */
  function execCommandFallback(text, onSuccess) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      var ok = document.execCommand('copy');
      if (ok) onSuccess();
    } catch (e) { /* nothing we can do */ }
    document.body.removeChild(ta);
  }

  document.querySelectorAll('.snippet-copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var codeEl = document.getElementById(btn.dataset.copyTarget);
      if (!codeEl) return;
      copyText(codeEl.textContent || codeEl.innerText || '', btn);
    });
  });
})();
