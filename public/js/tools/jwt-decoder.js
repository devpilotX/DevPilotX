/* ==========================================================================
   JWT DECODER v1 — public/js/tools/jwt-decoder.js
   Value.Codes | All decoding runs 100% client-side (Base64url decoding).
   ========================================================================== */

(function () {
  'use strict';

  var SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiZW1haWwiOiJqb2huQGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTksImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5jb20iLCJhdWQiOiJteS1hcHAiLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

  /* ---- DOM ---- */
  var input       = document.getElementById('jwt-input');
  var pasteBtn    = document.getElementById('jwt-paste-btn');
  var sampleBtn   = document.getElementById('jwt-sample-btn');
  var clearBtn    = document.getElementById('jwt-clear-btn');
  var statusDot   = document.getElementById('jwt-status-dot');
  var statusText  = document.getElementById('jwt-status-text');
  var headerOut   = document.getElementById('jwt-header-out');
  var payloadOut  = document.getElementById('jwt-payload-out');
  var sigOut      = document.getElementById('jwt-sig-out');
  var claimsList  = document.getElementById('jwt-claims-list');
  var claimsSection = document.getElementById('jwt-claims-section');
  var tokenVisual = document.getElementById('jwt-token-visual');
  var toast       = document.getElementById('jwt-toast');

  if (!input) return;

  /* ---- Base64url decode ---- */
  function base64urlDecode(str) {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) str += '=';
    try {
      var binary = atob(str);
      var bytes = new Uint8Array(binary.length);
      for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch (e) {
      return null;
    }
  }

  /* ---- Format JSON ---- */
  function prettyJson(str) {
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch (e) {
      return str;
    }
  }

  /* ---- Syntax highlight JSON ---- */
  function highlightJson(json) {
    return json
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
        var cls = 'json-num';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-str';
        } else if (/true|false/.test(match)) {
          cls = 'json-bool';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return '<span class="' + cls + '">' + escHtml(match) + '</span>';
      });
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ---- Set status ---- */
  function setStatus(text, type) {
    if (statusText) statusText.textContent = text;
    if (statusDot) {
      statusDot.className = 'jwt-status-dot';
      statusDot.classList.add('jwt-status-' + (type || 'idle'));
    }
  }

  /* ---- Decode ---- */
  function decode(token) {
    token = (token || '').trim();
    if (!token) {
      clearOutput();
      setStatus('Paste a JWT token above to decode it', 'idle');
      return;
    }

    var parts = token.split('.');
    if (parts.length !== 3) {
      clearOutput();
      setStatus('Invalid JWT — must have 3 parts separated by dots', 'error');
      return;
    }

    var headerJson  = base64urlDecode(parts[0]);
    var payloadJson = base64urlDecode(parts[1]);

    if (!headerJson || !payloadJson) {
      clearOutput();
      setStatus('Failed to decode JWT — invalid Base64url encoding', 'error');
      return;
    }

    var header, payload;
    try {
      header  = JSON.parse(headerJson);
      payload = JSON.parse(payloadJson);
    } catch (e) {
      clearOutput();
      setStatus('Failed to parse JWT JSON — token may be malformed', 'error');
      return;
    }

    /* Token visual */
    if (tokenVisual) {
      tokenVisual.innerHTML =
        '<span class="jwt-part-h">' + escHtml(parts[0]) + '</span>' +
        '<span class="jwt-dot">.</span>' +
        '<span class="jwt-part-p">' + escHtml(parts[1]) + '</span>' +
        '<span class="jwt-dot">.</span>' +
        '<span class="jwt-part-s">' + escHtml(parts[2]) + '</span>';
      tokenVisual.classList.add('visible');
    }

    /* Header output */
    if (headerOut) {
      headerOut.innerHTML = highlightJson(prettyJson(headerJson));
    }

    /* Payload output */
    if (payloadOut) {
      payloadOut.innerHTML = highlightJson(prettyJson(payloadJson));
    }

    /* Signature */
    if (sigOut) sigOut.textContent = parts[2];

    /* Claims */
    renderClaims(payload);

    /* Status */
    var now = Math.floor(Date.now() / 1000);
    var expired = payload.exp && payload.exp < now;
    var alg = header.alg || 'unknown';
    setStatus(
      expired ? 'Token decoded — EXPIRED' : 'Token decoded — ' + alg,
      expired ? 'warn' : 'ok'
    );
  }

  /* ---- Render claims ---- */
  var CLAIM_NAMES = {
    sub: { label: 'Subject (sub)', hint: 'Entity the token represents' },
    iss: { label: 'Issuer (iss)', hint: 'Who issued the token' },
    aud: { label: 'Audience (aud)', hint: 'Intended recipient' },
    exp: { label: 'Expiration (exp)', hint: 'Token expires at', type: 'time' },
    nbf: { label: 'Not Before (nbf)', hint: 'Token valid from', type: 'time' },
    iat: { label: 'Issued At (iat)', hint: 'When the token was issued', type: 'time' },
    jti: { label: 'JWT ID (jti)', hint: 'Unique identifier for this token' }
  };

  function renderClaims(payload) {
    if (!claimsList) return;
    claimsList.innerHTML = '';
    var now = Math.floor(Date.now() / 1000);
    var hasClaims = false;

    Object.keys(payload).forEach(function(key) {
      var val = payload[key];
      var meta = CLAIM_NAMES[key];
      var row = document.createElement('div');
      row.className = 'jwt-claim-row';

      var keyEl = document.createElement('span');
      keyEl.className = 'jwt-claim-key';
      keyEl.textContent = meta ? meta.label : key;

      var valEl = document.createElement('span');
      valEl.className = 'jwt-claim-value';

      if (meta && meta.type === 'time' && typeof val === 'number') {
        var d = new Date(val * 1000);
        valEl.textContent = d.toLocaleString() + ' (' + val + ')';
        if (key === 'exp') {
          if (val < now) {
            row.classList.add('jwt-claim-expired');
            valEl.textContent += ' — EXPIRED';
          } else {
            row.classList.add('jwt-claim-valid');
          }
        }
      } else {
        valEl.textContent = typeof val === 'object' ? JSON.stringify(val) : String(val);
      }

      var hintEl = document.createElement('span');
      hintEl.className = 'jwt-claim-hint';
      hintEl.textContent = meta ? meta.hint : '';

      row.appendChild(keyEl);
      row.appendChild(valEl);
      if (meta) row.appendChild(hintEl);
      claimsList.appendChild(row);
      hasClaims = true;
    });

    if (claimsSection) claimsSection.style.display = hasClaims ? '' : 'none';
  }

  /* ---- Clear output ---- */
  function clearOutput() {
    if (headerOut)  headerOut.textContent  = '';
    if (payloadOut) payloadOut.textContent = '';
    if (sigOut)     sigOut.textContent     = '';
    if (claimsList) claimsList.innerHTML   = '';
    if (tokenVisual) { tokenVisual.innerHTML = ''; tokenVisual.classList.remove('visible'); }
  }

  /* ---- Copy section buttons ---- */
  document.querySelectorAll('.jwt-copy-section').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var section = btn.getAttribute('data-section');
      var el = section === 'header' ? headerOut : payloadOut;
      if (el && navigator.clipboard) {
        navigator.clipboard.writeText(el.textContent).then(function() { showToast(); });
      }
    });
  });

  function showToast() {
    if (!toast) return;
    toast.classList.add('cp-toast-visible');
    setTimeout(function() { toast.classList.remove('cp-toast-visible'); }, 1800);
  }

  /* ---- Controls ---- */
  if (input) input.addEventListener('input', function() { decode(this.value); });

  if (pasteBtn) {
    pasteBtn.addEventListener('click', function() {
      if (navigator.clipboard) {
        navigator.clipboard.readText().then(function(text) {
          input.value = text;
          decode(text);
        }).catch(function() {});
      }
    });
  }

  if (sampleBtn) {
    sampleBtn.addEventListener('click', function() {
      input.value = SAMPLE;
      decode(SAMPLE);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      input.value = '';
      clearOutput();
      setStatus('Paste a JWT token above to decode it', 'idle');
    });
  }

  /* Add syntax highlight styles inline */
  var style = document.createElement('style');
  style.textContent = '.json-key{color:#7c3aed}.json-str{color:#16a34a}.json-num{color:#2563eb}.json-bool{color:#d97706}.json-null{color:#dc2626}';
  document.head.appendChild(style);

})();
