/**
 * ============================================================
 * contact.js — Contact Form Validation & Submission
 * ============================================================
 * Client-side validation, character counter, and
 * progressive enhancement for the contact form.
 * Zero dependencies. Zero inline scripts.
 * ============================================================
 */

'use strict';

(function () {

  /* ========== ELEMENTS ========== */
  const form    = document.getElementById('contact-form');
  if (!form) return;

  const nameInput    = document.getElementById('contact-name');
  const emailInput   = document.getElementById('contact-email');
  const subjectSel   = document.getElementById('contact-subject');
  const messageArea  = document.getElementById('contact-message');
  const submitBtn    = document.getElementById('contact-submit');
  const submitText   = document.getElementById('submit-text');
  const charCount    = document.getElementById('char-count');

  /* ========== CHARACTER COUNTER ========== */
  if (messageArea && charCount) {
    messageArea.addEventListener('input', function () {
      const len = this.value.length;
      const max = parseInt(this.getAttribute('maxlength'), 10) || 3000;
      charCount.textContent = len + ' / ' + max;
      charCount.style.color = len > max * 0.9 ? 'var(--warning)' : '';
    });
  }

  /* ========== VALIDATION HELPERS ========== */
  function showError(input, errorId, message) {
    const errEl = document.getElementById(errorId);
    input.classList.add('is-error');
    input.setAttribute('aria-invalid', 'true');
    if (errEl) errEl.textContent = message;
  }

  function clearError(input, errorId) {
    const errEl = document.getElementById(errorId);
    input.classList.remove('is-error');
    input.removeAttribute('aria-invalid');
    if (errEl) errEl.textContent = '';
  }

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
  }

  /* ========== LIVE VALIDATION ========== */
  function attachLiveValidation(input, errorId, validate) {
    if (!input) return;
    ['blur', 'input'].forEach(function (evt) {
      input.addEventListener(evt, function () {
        const result = validate(input.value);
        if (result === true) {
          clearError(input, errorId);
        } else {
          if (evt === 'blur' || input.classList.contains('is-error')) {
            showError(input, errorId, result);
          }
        }
      });
    });
  }

  attachLiveValidation(nameInput, 'name-error', function (val) {
    if (!val.trim()) return 'Name is required.';
    if (val.trim().length < 2) return 'Name must be at least 2 characters.';
    return true;
  });

  attachLiveValidation(emailInput, 'email-error', function (val) {
    if (!val.trim()) return 'Email address is required.';
    if (!isValidEmail(val)) return 'Please enter a valid email address.';
    return true;
  });

  if (subjectSel) {
    subjectSel.addEventListener('blur', function () {
      const errEl = document.getElementById('subject-error');
      if (!this.value) {
        this.classList.add('is-error');
        if (errEl) errEl.textContent = 'Please select a topic.';
      } else {
        this.classList.remove('is-error');
        if (errEl) errEl.textContent = '';
      }
    });
  }

  attachLiveValidation(messageArea, 'message-error', function (val) {
    if (!val.trim()) return 'Message is required.';
    if (val.trim().length < 20) return 'Message must be at least 20 characters.';
    return true;
  });

  /* ========== FORM SUBMISSION ========== */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    /* Honeypot check */
    const honeypot = form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value) return;

    let valid = true;

    /* Validate all fields */
    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      showError(nameInput, 'name-error', nameInput.value.trim() ? 'Name must be at least 2 characters.' : 'Name is required.');
      valid = false;
    } else {
      clearError(nameInput, 'name-error');
    }

    if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
      showError(emailInput, 'email-error', emailInput.value.trim() ? 'Please enter a valid email address.' : 'Email is required.');
      valid = false;
    } else {
      clearError(emailInput, 'email-error');
    }

    if (subjectSel && !subjectSel.value) {
      const errEl = document.getElementById('subject-error');
      subjectSel.classList.add('is-error');
      if (errEl) errEl.textContent = 'Please select a topic.';
      valid = false;
    }

    if (!messageArea.value.trim() || messageArea.value.trim().length < 20) {
      showError(messageArea, 'message-error', messageArea.value.trim() ? 'Message must be at least 20 characters.' : 'Message is required.');
      valid = false;
    } else {
      clearError(messageArea, 'message-error');
    }

    if (!valid) {
      /* Focus first error */
      const firstError = form.querySelector('.is-error');
      if (firstError) firstError.focus();
      return;
    }

    /* Disable button and show loading state */
    submitBtn.disabled = true;
    if (submitText) submitText.textContent = 'Sending…';

    /* Submit the form */
    form.submit();
  });

})();
