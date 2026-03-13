/**
 * ===================================================================
 * public/js/auth.js - Login and Register Client-Side Validation
 * ===================================================================
 */

(function () {
  'use strict';

  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');

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

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  var toggleBtn = document.getElementById('togglePassword');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function () {
      var passwordInput = document.getElementById('password');
      if (!passwordInput) return;

      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.setAttribute('aria-label', 'Hide password');
        toggleBtn.textContent = 'Hide';
      } else {
        passwordInput.type = 'password';
        toggleBtn.setAttribute('aria-label', 'Show password');
        toggleBtn.textContent = 'Show';
      }
    });
  }

  function setLoadingState(btn) {
    if (btn) {
      btn.classList.add('is-loading');
      btn.disabled = true;
    }
  }

  if (loginForm) {
    var loginEmail = document.getElementById('email');
    var loginPassword = document.getElementById('password');
    var loginBtn = document.getElementById('loginBtn');

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

    loginForm.addEventListener('submit', function (e) {
      var valid = true;
      var emailVal = loginEmail ? loginEmail.value.trim() : '';
      var passVal = loginPassword ? loginPassword.value : '';

      if (emailVal.length === 0) {
        setError('emailGroup', 'emailError', 'Email is required.');
        valid = false;
      } else if (!isValidEmail(emailVal)) {
        setError('emailGroup', 'emailError', 'Please enter a valid email address.');
        valid = false;
      }

      if (passVal.length === 0) {
        setError('passwordGroup', 'passwordError', 'Password is required.');
        valid = false;
      }

      if (!valid) {
        e.preventDefault();
        var firstError = loginForm.querySelector('.has-error input');
        if (firstError) firstError.focus();
        return;
      }

      setLoadingState(loginBtn);
    });
  }

  if (registerForm) {
    var regUsername = document.getElementById('username');
    var regEmail = document.getElementById('email');
    var regPassword = document.getElementById('password');
    var regConfirm = document.getElementById('confirm_password');
    var registerBtn = document.getElementById('registerBtn');
    var strengthFill = document.getElementById('passwordStrengthFill');
    var strengthLabel = document.getElementById('passwordStrengthLabel');
    var reqLength = document.getElementById('reqLength');
    var reqUpper = document.getElementById('reqUpper');
    var reqLower = document.getElementById('reqLower');
    var reqNumber = document.getElementById('reqNumber');

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

    function updateRequirementState(requirement, met) {
      if (!requirement) return;
      requirement.setAttribute('data-met', met ? 'true' : 'false');
      var statusEl = requirement.querySelector('.req-status');
      if (statusEl) {
        statusEl.textContent = met ? 'OK' : 'No';
      }
    }

    function updatePasswordStrength() {
      if (!regPassword) return;
      var val = regPassword.value;
      var hasLength = val.length >= 8;
      var hasUpper = /[A-Z]/.test(val);
      var hasLower = /[a-z]/.test(val);
      var hasNumber = /[0-9]/.test(val);
      var hasSpecial = /[^a-zA-Z0-9]/.test(val);

      updateRequirementState(reqLength, hasLength);
      updateRequirementState(reqUpper, hasUpper);
      updateRequirementState(reqLower, hasLower);
      updateRequirementState(reqNumber, hasNumber);

      var score = 0;
      if (hasLength) score++;
      if (hasUpper && hasLower) score++;
      if (hasNumber) score++;
      if (hasSpecial) score++;

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

    registerForm.addEventListener('submit', function (e) {
      var valid = true;
      var uVal = regUsername ? regUsername.value.trim() : '';
      var eVal = regEmail ? regEmail.value.trim() : '';
      var pVal = regPassword ? regPassword.value : '';
      var cVal = regConfirm ? regConfirm.value : '';

      if (uVal.length === 0) {
        setError('usernameGroup', 'usernameError', 'Username is required.');
        valid = false;
      } else if (uVal.length < 3 || uVal.length > 30) {
        setError('usernameGroup', 'usernameError', 'Username must be 3-30 characters.');
        valid = false;
      } else if (!/^[a-zA-Z0-9_-]+$/.test(uVal)) {
        setError('usernameGroup', 'usernameError', 'Only letters, numbers, hyphens, and underscores.');
        valid = false;
      }

      if (eVal.length === 0) {
        setError('emailGroup', 'emailError', 'Email is required.');
        valid = false;
      } else if (!isValidEmail(eVal)) {
        setError('emailGroup', 'emailError', 'Please enter a valid email address.');
        valid = false;
      }

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

      setLoadingState(registerBtn);
    });
  }
})();
