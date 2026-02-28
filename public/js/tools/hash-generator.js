/* ==========================================================================
   HASH GENERATOR v1 — public/js/tools/hash-generator.js
   Value.Codes | Uses Web Crypto API (SHA) and pure-JS MD5.
   ========================================================================== */

(function () {
  'use strict';

  /* ---- Pure JS MD5 (Ronald Rivest's RFC 1321 algorithm) ---- */
  function md5(str) {
    function safeAdd(x, y) { var lsw=(x&0xFFFF)+(y&0xFFFF); var msw=(x>>16)+(y>>16)+(lsw>>16); return (msw<<16)|(lsw&0xFFFF); }
    function bitRotateLeft(num, cnt) { return (num<<cnt)|(num>>>(32-cnt)); }
    function md5cmn(q,a,b,x,s,t) { return safeAdd(bitRotateLeft(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b); }
    function md5ff(a,b,c,d,x,s,t) { return md5cmn((b&c)|((~b)&d),a,b,x,s,t); }
    function md5gg(a,b,c,d,x,s,t) { return md5cmn((b&d)|(c&(~d)),a,b,x,s,t); }
    function md5hh(a,b,c,d,x,s,t) { return md5cmn(b^c^d,a,b,x,s,t); }
    function md5ii(a,b,c,d,x,s,t) { return md5cmn(c^(b|(~d)),a,b,x,s,t); }

    var bStr = unescape(encodeURIComponent(str));
    var m = [], i, l = bStr.length;
    for (i = 0; i < l; i++) { m[i >> 2] |= bStr.charCodeAt(i) << ((i % 4) * 8); }
    m[l >> 2] |= 0x80 << ((l % 4) * 8);
    m[(((l + 8) >> 6) << 4) + 14] = l * 8;

    var a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;
    for (i = 0; i < m.length; i += 16) {
      var aa=a,bb=b,cc=c,dd=d;
      a=md5ff(a,b,c,d,m[i+0],7,-680876936);d=md5ff(d,a,b,c,m[i+1],12,-389564586);c=md5ff(c,d,a,b,m[i+2],17,606105819);b=md5ff(b,c,d,a,m[i+3],22,-1044525330);
      a=md5ff(a,b,c,d,m[i+4],7,-176418897);d=md5ff(d,a,b,c,m[i+5],12,1200080426);c=md5ff(c,d,a,b,m[i+6],17,-1473231341);b=md5ff(b,c,d,a,m[i+7],22,-45705983);
      a=md5ff(a,b,c,d,m[i+8],7,1770035416);d=md5ff(d,a,b,c,m[i+9],12,-1958414417);c=md5ff(c,d,a,b,m[i+10],17,-42063);b=md5ff(b,c,d,a,m[i+11],22,-1990404162);
      a=md5ff(a,b,c,d,m[i+12],7,1804603682);d=md5ff(d,a,b,c,m[i+13],12,-40341101);c=md5ff(c,d,a,b,m[i+14],17,-1502002290);b=md5ff(b,c,d,a,m[i+15],22,1236535329);
      a=md5gg(a,b,c,d,m[i+1],5,-165796510);d=md5gg(d,a,b,c,m[i+6],9,-1069501632);c=md5gg(c,d,a,b,m[i+11],14,643717713);b=md5gg(b,c,d,a,m[i+0],20,-373897302);
      a=md5gg(a,b,c,d,m[i+5],5,-701558691);d=md5gg(d,a,b,c,m[i+10],9,38016083);c=md5gg(c,d,a,b,m[i+15],14,-660478335);b=md5gg(b,c,d,a,m[i+4],20,-405537848);
      a=md5gg(a,b,c,d,m[i+9],5,568446438);d=md5gg(d,a,b,c,m[i+14],9,-1019803690);c=md5gg(c,d,a,b,m[i+3],14,-187363961);b=md5gg(b,c,d,a,m[i+8],20,1163531501);
      a=md5gg(a,b,c,d,m[i+13],5,-1444681467);d=md5gg(d,a,b,c,m[i+2],9,-51403784);c=md5gg(c,d,a,b,m[i+7],14,1735328473);b=md5gg(b,c,d,a,m[i+12],20,-1926607734);
      a=md5hh(a,b,c,d,m[i+5],4,-378558);d=md5hh(d,a,b,c,m[i+8],11,-2022574463);c=md5hh(c,d,a,b,m[i+11],16,1839030562);b=md5hh(b,c,d,a,m[i+14],23,-35309556);
      a=md5hh(a,b,c,d,m[i+1],4,-1530992060);d=md5hh(d,a,b,c,m[i+4],11,1272893353);c=md5hh(c,d,a,b,m[i+7],16,-155497632);b=md5hh(b,c,d,a,m[i+10],23,-1094730640);
      a=md5hh(a,b,c,d,m[i+13],4,681279174);d=md5hh(d,a,b,c,m[i+0],11,-358537222);c=md5hh(c,d,a,b,m[i+3],16,-722521979);b=md5hh(b,c,d,a,m[i+6],23,76029189);
      a=md5hh(a,b,c,d,m[i+9],4,-640364487);d=md5hh(d,a,b,c,m[i+12],11,-421815835);c=md5hh(c,d,a,b,m[i+15],16,530742520);b=md5hh(b,c,d,a,m[i+2],23,-995338651);
      a=md5ii(a,b,c,d,m[i+0],6,-198630844);d=md5ii(d,a,b,c,m[i+7],10,1126891415);c=md5ii(c,d,a,b,m[i+14],15,-1416354905);b=md5ii(b,c,d,a,m[i+5],21,-57434055);
      a=md5ii(a,b,c,d,m[i+12],6,1700485571);d=md5ii(d,a,b,c,m[i+3],10,-1894986606);c=md5ii(c,d,a,b,m[i+10],15,-1051523);b=md5ii(b,c,d,a,m[i+1],21,-2054922799);
      a=md5ii(a,b,c,d,m[i+8],6,1873313359);d=md5ii(d,a,b,c,m[i+15],10,-30611744);c=md5ii(c,d,a,b,m[i+6],15,-1560198380);b=md5ii(b,c,d,a,m[i+13],21,1309151649);
      a=md5ii(a,b,c,d,m[i+4],6,-145523070);d=md5ii(d,a,b,c,m[i+11],10,-1120210379);c=md5ii(c,d,a,b,m[i+2],15,718787259);b=md5ii(b,c,d,a,m[i+9],21,-343485551);
      a=safeAdd(a,aa);b=safeAdd(b,bb);c=safeAdd(c,cc);d=safeAdd(d,dd);
    }
    function int32ToHex(val) {
      var hex = '';
      for (var j=0;j<4;j++) { hex += ('0'+(val&0xFF).toString(16)).slice(-2); val>>=8; }
      return hex;
    }
    return [a,b,c,d].map(int32ToHex).join('');
  }

  /* ---- SHA via Web Crypto API ---- */
  function shaHash(algorithm, text) {
    var encoder = new TextEncoder();
    var data = encoder.encode(text);
    return crypto.subtle.digest(algorithm, data).then(function(buf) {
      return Array.from(new Uint8Array(buf)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
    });
  }

  /* ---- DOM ---- */
  var hashInput    = document.getElementById('hash-input');
  var charCount    = document.getElementById('hash-char-count');
  var byteCount    = document.getElementById('hash-byte-count');
  var pasteBtn     = document.getElementById('hash-paste-btn');
  var clearInputBtn = document.getElementById('hash-clear-input-btn');
  var sampleBtn    = document.getElementById('hash-sample-btn');
  var clearBtn     = document.getElementById('hash-clear-btn');
  var uppercaseCb  = document.getElementById('hash-uppercase');
  var hmacCb       = document.getElementById('hash-hmac');
  var hmacKeyWrap  = document.getElementById('hash-hmac-key-wrap');
  var hmacKey      = document.getElementById('hash-hmac-key');
  var md5Out       = document.getElementById('hash-md5');
  var sha1Out      = document.getElementById('hash-sha1');
  var sha256Out    = document.getElementById('hash-sha256');
  var sha512Out    = document.getElementById('hash-sha512');
  var compareInput = document.getElementById('hash-compare-input');
  var compareResult = document.getElementById('hash-compare-result');
  var toast        = document.getElementById('hash-toast');

  if (!hashInput) return;

  var upper = false;

  /* ---- Update stats ---- */
  function updateStats(text) {
    var bytes = new TextEncoder().encode(text).length;
    if (charCount) charCount.textContent = text.length.toLocaleString() + ' chars';
    if (byteCount) byteCount.textContent = bytes.toLocaleString() + ' bytes';
  }

  /* ---- Set output ---- */
  function setOut(el, val) {
    if (!el) return;
    el.textContent = upper ? val.toUpperCase() : val;
  }

  /* ---- Hash text ---- */
  function hashText(text) {
    if (!text) {
      [md5Out, sha1Out, sha256Out, sha512Out].forEach(function(el) { if (el) el.textContent = ''; });
      clearCompare();
      return;
    }

    /* MD5 (sync) */
    setOut(md5Out, md5(text));

    /* SHA via Web Crypto (async) */
    if (crypto && crypto.subtle) {
      shaHash('SHA-1', text).then(function(h) { setOut(sha1Out, h); updateCompare(); });
      shaHash('SHA-256', text).then(function(h) { setOut(sha256Out, h); updateCompare(); });
      shaHash('SHA-512', text).then(function(h) { setOut(sha512Out, h); updateCompare(); });
    } else {
      [sha1Out, sha256Out, sha512Out].forEach(function(el) {
        if (el) el.textContent = 'Web Crypto not available';
      });
    }

    updateCompare();
  }

  /* ---- Compare ---- */
  function updateCompare() {
    if (!compareInput || !compareInput.value.trim()) { clearCompare(); return; }
    var target = compareInput.value.trim().toLowerCase();
    var outputs = [md5Out, sha1Out, sha256Out, sha512Out];
    var match = outputs.some(function(el) {
      return el && el.textContent && el.textContent.toLowerCase() === target;
    });
    if (compareResult) {
      compareResult.classList.remove('hash-compare-hidden', 'hash-compare-match', 'hash-compare-mismatch');
      compareResult.classList.add(match ? 'hash-compare-match' : 'hash-compare-mismatch');
      compareResult.textContent = match ? '✓ Hash matches!' : '✗ No match found';
    }
  }

  function clearCompare() {
    if (compareResult) {
      compareResult.classList.add('hash-compare-hidden');
      compareResult.classList.remove('hash-compare-match', 'hash-compare-mismatch');
    }
  }

  /* ---- Events ---- */
  hashInput.addEventListener('input', function() {
    updateStats(this.value);
    hashText(this.value);
  });

  if (pasteBtn) {
    pasteBtn.addEventListener('click', function() {
      if (navigator.clipboard) {
        navigator.clipboard.readText().then(function(text) {
          hashInput.value = text;
          updateStats(text);
          hashText(text);
        }).catch(function(){});
      }
    });
  }

  if (clearInputBtn) {
    clearInputBtn.addEventListener('click', function() {
      hashInput.value = '';
      updateStats('');
      hashText('');
    });
  }

  if (sampleBtn) {
    sampleBtn.addEventListener('click', function() {
      var sample = 'Hello, World! This is a test string for hash generation.';
      hashInput.value = sample;
      updateStats(sample);
      hashText(sample);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      hashInput.value = '';
      updateStats('');
      hashText('');
    });
  }

  if (uppercaseCb) {
    uppercaseCb.addEventListener('change', function() {
      upper = this.checked;
      hashText(hashInput.value);
    });
  }

  if (hmacCb) {
    hmacCb.addEventListener('change', function() {
      if (hmacKeyWrap) hmacKeyWrap.classList.toggle('hash-hmac-hidden', !this.checked);
    });
  }

  if (compareInput) {
    compareInput.addEventListener('input', updateCompare);
  }

  /* ---- Copy buttons ---- */
  document.querySelectorAll('.hash-copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var el = document.getElementById(btn.getAttribute('data-target'));
      if (el && el.textContent && navigator.clipboard) {
        navigator.clipboard.writeText(el.textContent).then(function() { showToast(); });
      }
    });
  });

  function showToast() {
    if (!toast) return;
    toast.classList.add('cp-toast-visible');
    setTimeout(function() { toast.classList.remove('cp-toast-visible'); }, 1800);
  }

})();
