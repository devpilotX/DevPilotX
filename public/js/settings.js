/**
 * public/js/settings.js — Account Settings Page
 * - Sidebar nav active state on scroll
 * - Bio character counter
 * - Password show/hide toggles
 * - Live password requirement indicators
 * - Confirm-password match check
 * - Avatar URL live preview
 * - Delete account confirm/cancel
 */
(function () {
  'use strict';

  /* ============================================================
   * SIDEBAR NAV — highlight active section on scroll
   * ============================================================ */
  var navItems = document.querySelectorAll('.settings-nav-item[data-section]');
  var sections = Array.from(navItems).map(function (item) {
    return document.getElementById(item.getAttribute('data-section'));
  }).filter(Boolean);

  function updateActiveNav() {
    var scrollY = window.scrollY;
    var active = sections[0];

    sections.forEach(function (sec) {
      var top = sec.getBoundingClientRect().top + scrollY - 120;
      if (scrollY >= top) active = sec;
    });

    navItems.forEach(function (item) {
      var match = item.getAttribute('data-section') === active.id;
      item.classList.toggle('is-active', match);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  /* ============================================================
   * SIDEBAR NAV — smooth scroll on click
   * ============================================================ */
  navItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      var target = document.getElementById(item.getAttribute('data-section'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ============================================================
   * BIO CHARACTER COUNTER
   * ============================================================ */
  var bioInput = document.getElementById('bio');
  var bioCount = document.getElementById('bioCount');

  if (bioInput && bioCount) {
    bioCount.textContent = bioInput.value.length;
    bioInput.addEventListener('input', function () {
      bioCount.textContent = bioInput.value.length;
    });
  }

  /* ============================================================
   * PASSWORD SHOW/HIDE TOGGLES
   * ============================================================ */
  document.querySelectorAll('.sform-toggle-pw').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var targetId = btn.getAttribute('data-target');
      var input = document.getElementById(targetId);
      if (!input) return;

      var eyeOpen = btn.querySelector('.eye-open');
      var eyeClosed = btn.querySelector('.eye-closed');

      if (input.type === 'password') {
        input.type = 'text';
        btn.setAttribute('aria-label', 'Hide password');
        if (eyeOpen)   eyeOpen.style.display   = 'none';
        if (eyeClosed) eyeClosed.style.display  = 'block';
      } else {
        input.type = 'password';
        btn.setAttribute('aria-label', 'Show password');
        if (eyeOpen)   eyeOpen.style.display   = 'block';
        if (eyeClosed) eyeClosed.style.display  = 'none';
      }
    });
  });

  /* ============================================================
   * PASSWORD REQUIREMENTS — live indicators
   * ============================================================ */
  var newPwInput   = document.getElementById('newPassword');
  var confirmPwInput = document.getElementById('confirmPassword');
  var reqLen   = document.getElementById('req-len');
  var reqUpper = document.getElementById('req-upper');
  var reqLower = document.getElementById('req-lower');
  var reqNum   = document.getElementById('req-num');
  var confirmPwError = document.getElementById('confirmPasswordError');

  function setReq(el, met) {
    if (el) el.setAttribute('data-met', met ? 'true' : 'false');
  }

  if (newPwInput) {
    newPwInput.addEventListener('input', function () {
      var v = newPwInput.value;
      setReq(reqLen,   v.length >= 8);
      setReq(reqUpper, /[A-Z]/.test(v));
      setReq(reqLower, /[a-z]/.test(v));
      setReq(reqNum,   /[0-9]/.test(v));

      /* Re-validate confirm field if it has a value */
      if (confirmPwInput && confirmPwInput.value.length > 0 && confirmPwError) {
        confirmPwError.textContent = confirmPwInput.value !== v
          ? 'Passwords do not match.' : '';
      }
    });
  }

  if (confirmPwInput && confirmPwError) {
    confirmPwInput.addEventListener('input', function () {
      if (newPwInput) {
        confirmPwError.textContent = confirmPwInput.value !== newPwInput.value
          ? 'Passwords do not match.' : '';
      }
    });
  }

  /* ============================================================
   * PASSWORD FORM — client-side guard before submit
   * ============================================================ */
  var passwordForm = document.getElementById('passwordForm');
  if (passwordForm) {
    passwordForm.addEventListener('submit', function (e) {
      var valid = true;
      var currentEl = document.getElementById('currentPassword');
      var currentErr = document.getElementById('currentPasswordError');
      var newEl = document.getElementById('newPassword');
      var newErr = document.getElementById('newPasswordError');

      if (currentEl && currentEl.value.trim() === '') {
        if (currentErr) currentErr.textContent = 'Current password is required.';
        valid = false;
      } else if (currentErr) { currentErr.textContent = ''; }

      if (newEl) {
        var v = newEl.value;
        if (v.length < 8 || !/[A-Z]/.test(v) || !/[a-z]/.test(v) || !/[0-9]/.test(v)) {
          if (newErr) newErr.textContent = 'Password does not meet the requirements.';
          valid = false;
        } else if (newErr) { newErr.textContent = ''; }
      }

      if (confirmPwInput && newPwInput && confirmPwInput.value !== newPwInput.value) {
        if (confirmPwError) confirmPwError.textContent = 'Passwords do not match.';
        valid = false;
      }

      if (!valid) e.preventDefault();
    });
  }

  /* ============================================================
   * AVATAR LIVE PREVIEW
   * ============================================================ */
  var avatarInput    = document.getElementById('avatar');
  var previewImg     = document.getElementById('avatarPreviewImg');
  var previewInit    = document.getElementById('avatarPreviewInitials');
  var avatarError    = document.getElementById('avatarError');
  var clearAvatarBtn = document.getElementById('clearAvatarBtn');

  if (avatarInput && previewImg) {
    avatarInput.addEventListener('input', function () {
      var url = avatarInput.value.trim();
      if (!url) {
        previewImg.style.display = 'none';
        if (previewInit) previewInit.style.display = 'flex';
        if (avatarError) avatarError.textContent = '';
        return;
      }
      previewImg.onload = function () {
        previewImg.style.display = 'block';
        if (previewInit) previewInit.style.display = 'none';
        if (avatarError) avatarError.textContent = '';
      };
      previewImg.onerror = function () {
        previewImg.style.display = 'none';
        if (previewInit) previewInit.style.display = 'flex';
        if (avatarError) avatarError.textContent = 'Could not load image from that URL.';
      };
      previewImg.src = url;
    });
  }

  if (clearAvatarBtn && avatarInput) {
    clearAvatarBtn.addEventListener('click', function () {
      avatarInput.value = '';
      if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
      if (previewInit) previewInit.style.display = 'flex';
      if (avatarError) avatarError.textContent = '';
    });
  }

  /* ============================================================
   * DELETE ACCOUNT — show / hide confirmation box
   * ============================================================ */
  var showDeleteBtn   = document.getElementById('showDeleteForm');
  var deleteConfirm   = document.getElementById('deleteConfirmBox');
  var cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  var deleteForm      = document.getElementById('deleteForm');
  var deleteSubmitBtn = document.getElementById('deleteSubmitBtn');
  var deletePwInput   = document.getElementById('deletePassword');
  var deletePwError   = document.getElementById('deletePasswordError');

  if (showDeleteBtn && deleteConfirm) {
    showDeleteBtn.addEventListener('click', function () {
      deleteConfirm.hidden = false;
      showDeleteBtn.style.display = 'none';
      if (deletePwInput) deletePwInput.focus();
    });
  }

  if (cancelDeleteBtn && deleteConfirm) {
    cancelDeleteBtn.addEventListener('click', function () {
      deleteConfirm.hidden = true;
      if (showDeleteBtn) showDeleteBtn.style.display = '';
      if (deletePwInput) deletePwInput.value = '';
      if (deletePwError) deletePwError.textContent = '';
    });
  }

  if (deleteForm && deleteSubmitBtn) {
    deleteForm.addEventListener('submit', function (e) {
      if (!deletePwInput || deletePwInput.value.trim() === '') {
        e.preventDefault();
        if (deletePwError) deletePwError.textContent = 'Please enter your password.';
        return;
      }
      /* Disable button to prevent double-submit */
      deleteSubmitBtn.disabled = true;
      deleteSubmitBtn.textContent = 'Deleting…';
    });
  }

})();
