/**
 * ================================================================
 * FILE: public/js/api-single.js
 * PURPOSE: Copy buttons for API single page
 * ================================================================
 */

(function () {
  'use strict';

  document.querySelectorAll('.api-copy-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var textToCopy = '';

      /* Copy from data attribute or target element */
      if (this.dataset.copyText) {
        textToCopy = this.dataset.copyText;
      } else if (this.dataset.copyTarget) {
        var target = document.getElementById(this.dataset.copyTarget);
        if (target) textToCopy = target.textContent;
      }

      if (!textToCopy) return;

      var button = this;
      var originalHTML = button.innerHTML;

      navigator.clipboard.writeText(textToCopy).then(function () {
        button.innerHTML = '✅ Copied!';
        setTimeout(function () {
          button.innerHTML = originalHTML;
        }, 2000);
      }).catch(function () {
        /* Fallback */
        var textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        button.innerHTML = '✅ Copied!';
        setTimeout(function () {
          button.innerHTML = originalHTML;
        }, 2000);
      });
    });
  });

})();