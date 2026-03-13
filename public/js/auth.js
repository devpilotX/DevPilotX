/**
 * ===================================================================
 * public/js/auth.js — Login & Register Client-Side Validation
 * ===================================================================
 * Live field validation, password visibility toggle, password
 * strength meter, requirement checklist, and form submission UX.
 * ===================================================================
 */

(function () {
  'use strict';

  /* ========== DETECT WHICH FORM IS ON THE PAGE ========== */
  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');

  /* ========== HELPERS ========== */

  /**
   * Set error state on a form group.
   */
  function setError(groupId, errorId, message) {
    var group = document.getElementById(groupId);
    var error = document.getElementById(errorId);
    if (group) {
      group.classList.add('has-error');
      group.classList.remove('has-success');
    }
    if (error) {
      error.textContent = message;
    }
  }

  /**
   * Set success state on a form group.
   */
  function setSuccess(groupId, errorId) {
    var group = document.getElementById(groupId);
    var error = document.getElementById(errorId);
    if (group) {
      group.classList.remove('has-error');
      group.classList.add('has-success');
    }
    if (error) {
      error.textContent = '';
    }
  }

  /**
   * Clear validation state on a form group.
   */
  function clearState(groupId, errorId) {
    var group = document.getElementById(groupId);
    var error = document.getElementById(errorId);
    if (group) {
      group.classList.remove('has-error', 'has-success');
    }
    if (error) {
      error.textContent = '';
    }
  }

  /**
   * Simple email regex check (browser-level).
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ========== PASSWORD TOGGLE ========== */
  var toggleBtn = document.getElementById('togglePassword');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var passwordInput = document.getElementById('password');
      if (!passwordInput) return;

      var eyeOpen = toggleBtn.querySelector('.eye-open');
      var eyeClosed = toggleBtn.querySelector('.eye-closed');

      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.setAttribute('aria-label', 'Hide password');
        if (eyeOpen) eyeOpen.style.display = 'none';
        if (eyeClosed) eyeClosed.style.display = 'block';
      } else {
        passwordInput.type = 'password';
        toggleBtn.setAttribute('aria-label', 'Show password');
        if (eyeOpen) eyeOpen.style.display = 'block';
        if (eyeClosed) eyeClosed.style.display = 'none';
      }
    });
  }

  /* ========== LOADING STATE ON SUBMIT ========== */
  function setLoadingState(btn, form) {
    if (btn) {
      btn.classList.add('is-loading');
      btn.disabled = true;
    }
    /* Disable all inputs */
    if (form) {
      var inputs = form.querySelectorAll('input');
      inputs.forEach(function (input) {
        input.disabled = true;
      });
    }
  }

  /* ====================================================================
   * LOGIN FORM LOGIC
   * ==================================================================== */
  if (loginForm) {
    var loginEmail = document.getElementById('email');
    var loginPassword = document.getElementById('password');
    var loginBtn = document.getElementById('loginBtn');

    /* ========== LIVE VALIDATION ON BLUR ========== */
    if (loginEmail) {
      loginEmail.addEventListener('blur', function () {
        var val = loginEmail.value.trim();
        if (val.length === 0) {
          setError('emailGroup', 'emailError', 'Email is required.');
        } else if (!isValidEmail(val)) {
          setError('emailGroup', 'emailError', 'Please enter a valid email address.');
        } else {
          setSuccess('emailGroup', 'emailError');
        }
      });

      loginEmail.addEventListener('input', function () {
        clearState('emailGroup', 'emailError');
      });
    }

    if (loginPassword) {
      loginPassword.addEventListener('blur', function () {
        if (loginPassword.value.length === 0) {
          setError('passwordGroup', 'passwordError', 'Password is required.');
        } else {
          setSuccess('passwordGroup', 'passwordError');
        }
      });

      loginPassword.addEventListener('input', function () {
        clearState('passwordGroup', 'passwordError');
      });
    }

    /* ========== FORM SUBMIT ========== */
    loginForm.addEventListener('submit', function (e) {
      var valid = true;

      /* Validate email */
      var emailVal = loginEmail ? loginEmail.value.trim() : '';
      if (emailVal.length === 0) {
        setError('emailGroup', 'emailError', 'Email is required.');
        valid = false;
      } else if (!isValidEmail(emailVal)) {
        setError('emailGroup', 'emailError', 'Please enter a valid email address.');
        valid = false;
      }

      /* Validate password */
      var passVal = loginPassword ? loginPassword.value : '';
      if (passVal.length === 0) {
        setError('passwordGroup', 'passwordError', 'Password is required.');
        valid = false;
      }

      if (!valid) {
        e.preventDefault();
        /* Focus first error field */
        var firstError = loginForm.querySelector('.has-error input');
        if (firstError) firstError.focus();
        return;
      }

      /* Show loading state */
      setLoadingState(loginBtn, null);
    });
  }

  /* ====================================================================
   * REGISTER FORM LOGIC
   * ==================================================================== */
  if (registerForm) {
    var regUsername = document.getElementById('username');
    var regEmail = document.getElementById('email');
    var regPassword = document.getElementById('password');
    var regConfirm = document.getElementById('confirm_password');
    var registerBtn = document.getElementById('registerBtn');

    /* Password strength elements */
    var strengthFill = document.getElementById('passwordStrengthFill');
    var strengthLabel = document.getElementById('passwordStrengthLabel');

    /* Requirement elements */
    var reqLength = document.getElementById('reqLength');
    var reqUpper = document.getElementById('reqUpper');
    var reqLower = document.getElementById('reqLower');
    var reqNumber = document.getElementById('reqNumber');

    /* ========== USERNAME VALIDATION ========== */
    if (regUsername) {
      regUsername.addEventListener('blur', function () {
        var val = regUsername.value.trim();
        if (val.length === 0) {
          setError('usernameGroup', 'usernameError', 'Username is required.');
        } else if (val.length < 3) {
          setError('usernameGroup', 'usernameError', 'Username must be at least 3 characters.');
        } else if (val.length > 30) {
          setError('usernameGroup', 'usernameError', 'Username cannot exceed 30 characters.');
        } else if (!/^[a-zA-Z0-9_-]+$/.test(val)) {
          setError('usernameGroup', 'usernameError', 'Only letters, numbers, hyphens, and underscores.');
        } else {
          setSuccess('usernameGroup', 'usernameError');
        }
      });

      regUsername.addEventListener('input', function () {
        clearState('usernameGroup', 'usernameError');
      });
    }

    /* ========== EMAIL VALIDATION ========== */
    if (regEmail) {
      regEmail.addEventListener('blur', function () {
        var val = regEmail.value.trim();
        if (val.length === 0) {
          setError('emailGroup', 'emailError', 'Email is required.');
        } else if (!isValidEmail(val)) {
          setError('emailGroup', 'emailError', 'Please enter a valid email address.');
        } else {
          setSuccess('emailGroup', 'emailError');
        }
      });

      regEmail.addEventListener('input', function () {
        clearState('emailGroup', 'emailError');
      });
    }

    /* ========== PASSWORD STRENGTH & REQUIREMENTS ========== */
    function updatePasswordStrength() {
      if (!regPassword) return;
      var val = regPassword.value;

      /* Check individual requirements */
      var hasLength = val.length >= 8;
      var hasUpper = /[A-Z]/.test(val);
      var hasLower = /[a-z]/.test(val);
      var hasNumber = /[0-9]/.test(val);
      var hasSpecial = /[^a-zA-Z0-9]/.test(val);

      /* Update requirement indicators */
      if (reqLength) {
        reqLength.setAttribute('data-met', hasLength ? 'true' : 'false');
        var checkEl = reqLength.querySelector('.req-check');
        if (checkEl) checkEl.style.display = hasLength ? 'block' : 'none';
      }
      if (reqUpper) {
        reqUpper.setAttribute('data-met', hasUpper ? 'true' : 'false');
        var checkEl2 = reqUpper.querySelector('.req-check');
        if (checkEl2) checkEl2.style.display = hasUpper ? 'block' : 'none';
      }
      if (reqLower) {
        reqLower.setAttribute('data-met', hasLower ? 'true' : 'false');
        var checkEl3 = reqLower.querySelector('.req-check');
        if (checkEl3) checkEl3.style.display = hasLower ? 'block' : 'none';
      }
      if (reqNumber) {
        reqNumber.setAttribute('data-met', hasNumber ? 'true' : 'false');
        var checkEl4 = reqNumber.querySelector('.req-check');
        if (checkEl4) checkEl4.style.display = hasNumber ? 'block' : 'none';
      }

      /* Calculate strength score (0-4) */
      var score = 0;
      if (hasLength) score++;
      if (hasUpper && hasLower) score++;
      if (hasNumber) score++;
      if (hasSpecial) score++;

      /* Update strength bar and label */
      var strengthClasses = ['strength-weak', 'strength-fair', 'strength-good', 'strength-strong'];
      var strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];

      if (strengthFill) {
        strengthFill.className = 'password-strength-fill';
        if (val.length > 0 && score > 0) {
          strengthFill.classList.add(strengthClasses[score - 1]);
        }
      }

      if (strengthLabel) {
        strengthLabel.className = 'password-strength-label';
        if (val.length > 0 && score > 0) {
          strengthLabel.textContent = strengthLabels[score - 1];
          strengthLabel.classList.add(strengthClasses[score - 1]);
        } else {
          strengthLabel.textContent = '';
        }
      }
    }

    if (regPassword) {
      regPassword.addEventListener('input', function () {
        updatePasswordStrength();
        clearState('passwordGroup', 'passwordError');

        /* Also re-validate confirm if it has a value */
        if (regConfirm && regConfirm.value.length > 0) {
          if (regConfirm.value !== regPassword.value) {
            setError('confirmPasswordGroup', 'confirmPasswordError', 'Passwords do not match.');
          } else {
            setSuccess('confirmPasswordGroup', 'confirmPasswordError');
          }
        }
      });

      regPassword.addEventListener('blur', function () {
        var val = regPassword.value;
        if (val.length === 0) {
          setError('passwordGroup', 'passwordError', 'Password is required.');
        } else if (val.length < 8) {
          setError('passwordGroup', 'passwordError', 'Password must be at least 8 characters.');
        } else if (!/[A-Z]/.test(val)) {
          setError('passwordGroup', 'passwordError', 'Password must contain an uppercase letter.');
        } else if (!/[a-z]/.test(val)) {
          setError('passwordGroup', 'passwordError', 'Password must contain a lowercase letter.');
        } else if (!/[0-9]/.test(val)) {
          setError('passwordGroup', 'passwordError', 'Password must contain a number.');
        } else {
          setSuccess('passwordGroup', 'passwordError');
        }
      });
    }

    /* ========== CONFIRM PASSWORD VALIDATION ========== */
    if (regConfirm) {
      regConfirm.addEventListener('input', function () {
        if (regPassword && regConfirm.value.length > 0) {
          if (regConfirm.value !== regPassword.value) {
            setError('confirmPasswordGroup', 'confirmPasswordError', 'Passwords do not match.');
          } else {
            setSuccess('confirmPasswordGroup', 'confirmPasswordError');
          }
        } else {
          clearState('confirmPasswordGroup', 'confirmPasswordError');
        }
      });

      regConfirm.addEventListener('blur', function () {
        if (regConfirm.value.length === 0) {
          setError('confirmPasswordGroup', 'confirmPasswordError', 'Please confirm your password.');
        } else if (regPassword && regConfirm.value !== regPassword.value) {
          setError('confirmPasswordGroup', 'confirmPasswordError', 'Passwords do not match.');
        } else {
          setSuccess('confirmPasswordGroup', 'confirmPasswordError');
        }
      });
    }

    /* ========== FORM SUBMIT ========== */
    registerForm.addEventListener('submit', function (e) {
      var valid = true;

      /* Validate username */
      var uVal = regUsername ? regUsername.value.trim() : '';
      if (uVal.length === 0) {
        setError('usernameGroup', 'usernameError', 'Username is required.');
        valid = false;
      } else if (uVal.length < 3 || uVal.length > 30) {
        setError('usernameGroup', 'usernameError', 'Username must be 3–30 characters.');
        valid = false;
      } else if (!/^[a-zA-Z0-9_-]+$/.test(uVal)) {
        setError('usernameGroup', 'usernameError', 'Only letters, numbers, hyphens, and underscores.');
        valid = false;
      }

      /* Validate email */
      var eVal = regEmail ? regEmail.value.trim() : '';
      if (eVal.length === 0) {
        setError('emailGroup', 'emailError', 'Email is required.');
        valid = false;
      } else if (!isValidEmail(eVal)) {
        setError('emailGroup', 'emailError', 'Please enter a valid email address.');
        valid = false;
      }

      /* Validate password */
      var pVal = regPassword ? regPassword.value : '';
      if (pVal.length === 0) {
        setError('passwordGroup', 'passwordError', 'Password is required.');
        valid = false;
      } else if (pVal.length < 8) {
        setError('passwordGroup', 'passwordError', 'Password must be at least 8 characters.');
        valid = false;
      } else if (!/[A-Z]/.test(pVal)) {
        setError('passwordGroup', 'passwordError', 'Must contain an uppercase letter.');
        valid = false;
      } else if (!/[a-z]/.test(pVal)) {
        setError('passwordGroup', 'passwordError', 'Must contain a lowercase letter.');
        valid = false;
      } else if (!/[0-9]/.test(pVal)) {
        setError('passwordGroup', 'passwordError', 'Must contain a number.');
        valid = false;
      }

      /* Validate confirm password */
      var cVal = regConfirm ? regConfirm.value : '';
      if (cVal.length === 0) {
        setError('confirmPasswordGroup', 'confirmPasswordError', 'Please confirm your password.');
        valid = false;
      } else if (cVal !== pVal) {
        setError('confirmPasswordGroup', 'confirmPasswordError', 'Passwords do not match.');
        valid = false;
      }

      if (!valid) {
        e.preventDefault();
        var firstError = registerForm.querySelector('.has-error input');
        if (firstError) firstError.focus();
        return;
      }

      /* Show loading state */
      setLoadingState(registerBtn, null);
    });
  }

})();