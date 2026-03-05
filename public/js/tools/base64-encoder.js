/* ==========================================================================
   BASE64 ENCODER/DECODER — TOOL PAGE LOGIC
   Value.Codes — /tools/base64-encoder
   100% client-side. No data is ever sent to a server.
   ========================================================================== */

(function () {
  'use strict';

  /* ========================================================================
     DOM REFERENCES
     ======================================================================== */

  var tabText = document.getElementById('tab-text');
  var tabFile = document.getElementById('tab-file');
  var panelText = document.getElementById('panel-text');
  var panelFile = document.getElementById('panel-file');

  var dirBtns = document.querySelectorAll('.b64-dir-btn');
  var inputEl = document.getElementById('b64-input');
  var outputEl = document.getElementById('b64-output');
  var inputLabel = document.getElementById('b64-input-label');
  var outputLabel = document.getElementById('b64-output-label');
  var inputCount = document.getElementById('b64-input-count');
  var inputBytes = document.getElementById('b64-input-bytes');
  var outputCount = document.getElementById('b64-output-count');
  var outputBytes = document.getElementById('b64-output-bytes');

  var urlSafeCb = document.getElementById('b64-url-safe');
  var lineBreakCb = document.getElementById('b64-line-break');

  var pasteBtn = document.getElementById('b64-paste-btn');
  var clearBtn = document.getElementById('b64-clear-btn');
  var sampleBtn = document.getElementById('b64-sample-btn');
  var swapBtn = document.getElementById('b64-swap-btn');
  var copyBtn = document.getElementById('b64-copy-btn');
  var downloadBtn = document.getElementById('b64-download-btn');

  var statusBar = document.getElementById('b64-status-bar');
  var statusIcon = document.getElementById('b64-status-icon');
  var statusText = document.getElementById('b64-status-text');

  var fileZone = document.getElementById('b64-file-zone');
  var fileInput = document.getElementById('b64-file-input');
  var fileInfo = document.getElementById('b64-file-info');
  var fileName = document.getElementById('b64-file-name');
  var fileMeta = document.getElementById('b64-file-meta');
  var fileRemoveBtn = document.getElementById('b64-file-remove-btn');
  var fileOutputWrap = document.getElementById('b64-file-output-wrap');
  var fileOutputEl = document.getElementById('b64-file-output');
  var fileOutputCount = document.getElementById('b64-file-output-count');
  var fileCopyBtn = document.getElementById('b64-file-copy-btn');
  var fileDownloadBtn = document.getElementById('b64-file-download-btn');
  var dataUriCb = document.getElementById('b64-data-uri');
  var filePreview = document.getElementById('b64-file-preview');
  var previewContainer = document.getElementById('b64-preview-container');

  var faqQuestions = document.querySelectorAll('.tool-faq-question');


  /* ========================================================================
     STATE
     ======================================================================== */

  var direction = 'encode';
  var currentFileData = null;
  var currentFileMime = '';

  var SAMPLE_TEXT = '{"name":"Value.Codes","type":"Developer Tools","free":true,"tools":10,"languages":19,"message":"Hello, World! 🚀"}';
  var MAX_FILE_SIZE = 5 * 1024 * 1024;


  /* ========================================================================
     UTILITY — UTF-8 SAFE BASE64
     ======================================================================== */

  /**
   * Encode a string to Base64, properly handling all UTF-8 characters
   * including emoji and multi-byte sequences.
   */
  function utf8ToBase64(str) {
    var bytes = new TextEncoder().encode(str);
    var binary = '';
    for (var i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Decode a Base64 string back to UTF-8 text.
   */
  function base64ToUtf8(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  }

  /**
   * Convert standard Base64 to URL-safe variant.
   */
  function toUrlSafe(str) {
    return str.replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
  }

  /**
   * Convert URL-safe Base64 back to standard.
   */
  function fromUrlSafe(str) {
    var s = str.replace(/-/g, '+').replace(/_/g, '/');
    var pad = s.length % 4;
    if (pad) {
      s += '===='.substring(pad);
    }
    return s;
  }

  /**
   * Insert line breaks at every 76 characters (MIME standard).
   */
  function addLineBreaks(str) {
    return str.replace(/.{1,76}/g, '$&\\n').trim();
  }

  /**
   * Remove all whitespace from a Base64 string.
   */
  function stripWhitespace(str) {
    return str.replace(/\\s+/g, '');
  }

  /**
   * Get byte size of a UTF-8 string.
   */
  function getByteSize(str) {
    return new TextEncoder().encode(str).length;
  }

  /**
   * Format bytes to human-readable string.
   */
  function formatBytes(bytes) {
    if (bytes === 0) return '0 bytes';
    if (bytes === 1) return '1 byte';
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  /**
   * Format character count.
   */
  function formatChars(len) {
    return len.toLocaleString() + ' char' + (len === 1 ? '' : 's');
  }


  /* ========================================================================
     STATUS HELPERS
     ======================================================================== */

  function setStatus(type, icon, msg) {
    statusBar.classList.remove('b64-status-bar-success', 'b64-status-bar-error', 'b64-status-bar-warning');
    if (type) {
      statusBar.classList.add('b64-status-bar-' + type);
    }
    statusIcon.textContent = icon;
    statusText.textContent = msg;
  }

  function resetStatus() {
    setStatus('', '', 'Ready — enter text above to encode or decode.');
  }


  /* ========================================================================
     CORE — ENCODE / DECODE
     ======================================================================== */

  function processText() {
    var input = inputEl.value;

    /* Update input stats */
    inputCount.textContent = formatChars(input.length);
    inputBytes.textContent = formatBytes(getByteSize(input));

    if (!input) {
      outputEl.value = '';
      outputCount.textContent = '0 chars';
      outputBytes.textContent = '0 bytes';
      resetStatus();
      return;
    }

    var result = '';

    try {
      if (direction === 'encode') {
        result = utf8ToBase64(input);

        if (urlSafeCb.checked) {
          result = toUrlSafe(result);
        }

        if (lineBreakCb.checked && !urlSafeCb.checked) {
          result = addLineBreaks(result);
        }

        setStatus('success', '✓', 'Encoded successfully — ' + formatChars(input.length) + ' → ' + formatChars(result.length) + ' (×' + (result.length / Math.max(input.length, 1)).toFixed(2) + ' size)');
      } else {
        var cleaned = stripWhitespace(input);

        if (urlSafeCb.checked) {
          cleaned = fromUrlSafe(cleaned);
        }

        result = base64ToUtf8(cleaned);

        setStatus('success', '✓', 'Decoded successfully — ' + formatChars(input.length) + ' → ' + formatChars(result.length));
      }
    } catch (err) {
      result = '';
      if (direction === 'decode') {
        setStatus('error', '✕', 'Invalid Base64 string — check for typos or missing characters.');
      } else {
        setStatus('error', '✕', 'Encoding failed — ' + (err.message || 'unexpected error'));
      }
    }

    outputEl.value = result;
    outputCount.textContent = formatChars(result.length);
    outputBytes.textContent = formatBytes(getByteSize(result));
  }


  /* ========================================================================
     DIRECTION TOGGLE
     ======================================================================== */

  function setDirection(dir) {
    direction = dir;

    dirBtns.forEach(function (btn) {
      var isActive = btn.getAttribute('data-direction') === dir;
      btn.classList.toggle('b64-dir-btn-active', isActive);
      btn.setAttribute('aria-checked', String(isActive));
    });

    if (dir === 'encode') {
      inputLabel.textContent = 'Plain Text';
      outputLabel.textContent = 'Base64 Encoded';
      inputEl.setAttribute('placeholder', 'Enter text to encode...');
      outputEl.setAttribute('placeholder', 'Encoded result will appear here...');
    } else {
      inputLabel.textContent = 'Base64 String';
      outputLabel.textContent = 'Decoded Text';
      inputEl.setAttribute('placeholder', 'Paste Base64 string to decode...');
      outputEl.setAttribute('placeholder', 'Decoded result will appear here...');
    }

    processText();
  }

  dirBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setDirection(btn.getAttribute('data-direction'));
    });
  });


  /* ========================================================================
     TAB SWITCHING (Text / File)
     ======================================================================== */

  function setTab(tab) {
    var isText = tab === 'text';

    tabText.classList.toggle('b64-mode-tab-active', isText);
    tabFile.classList.toggle('b64-mode-tab-active', !isText);
    tabText.setAttribute('aria-selected', String(isText));
    tabFile.setAttribute('aria-selected', String(!isText));

    panelText.classList.toggle('b64-panel-hidden', !isText);
    panelFile.classList.toggle('b64-panel-hidden', isText);
  }

  tabText.addEventListener('click', function () {
    setTab('text');
  });

  tabFile.addEventListener('click', function () {
    setTab('file');
  });


  /* ========================================================================
     TEXT INPUT EVENTS
     ======================================================================== */

  var debounceTimer = null;

  inputEl.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processText, 80);
  });

  urlSafeCb.addEventListener('change', processText);
  lineBreakCb.addEventListener('change', processText);


  /* ========================================================================
     ACTION BUTTONS — TEXT PANEL
     ======================================================================== */

  /* Paste from clipboard */
  pasteBtn.addEventListener('click', function () {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function (text) {
        inputEl.value = text;
        inputEl.focus();
        processText();
      }).catch(function () {
        setStatus('warning', '⚠', 'Clipboard access denied — paste manually with Ctrl+V.');
      });
    } else {
      inputEl.focus();
      setStatus('warning', '⚠', 'Clipboard API not available — paste manually with Ctrl+V.');
    }
  });

  /* Clear input */
  clearBtn.addEventListener('click', function () {
    inputEl.value = '';
    outputEl.value = '';
    inputCount.textContent = '0 chars';
    inputBytes.textContent = '0 bytes';
    outputCount.textContent = '0 chars';
    outputBytes.textContent = '0 bytes';
    resetStatus();
    inputEl.focus();
  });

  /* Load sample */
  sampleBtn.addEventListener('click', function () {
    inputEl.value = SAMPLE_TEXT;
    inputEl.focus();
    processText();
  });

  /* Swap input and output */
  swapBtn.addEventListener('click', function () {
    var temp = outputEl.value;
    outputEl.value = '';

    if (direction === 'encode') {
      setDirection('decode');
    } else {
      setDirection('encode');
    }

    inputEl.value = temp;
    processText();
  });

  /* Copy output */
  copyBtn.addEventListener('click', function () {
    var text = outputEl.value;
    if (!text) {
      setStatus('warning', '⚠', 'Nothing to copy — output is empty.');
      return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        var originalText = copyBtn.textContent;
        copyBtn.classList.add('b64-action-btn-success');
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setStatus('success', '✓', 'Copied to clipboard!');

        setTimeout(function () {
          copyBtn.classList.remove('b64-action-btn-success');
          copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
        }, 2000);
      }).catch(function () {
        setStatus('error', '✕', 'Copy failed — please select and copy manually.');
      });
    }
  });

  /* Download output */
  downloadBtn.addEventListener('click', function () {
    var text = outputEl.value;
    if (!text) {
      setStatus('warning', '⚠', 'Nothing to download — output is empty.');
      return;
    }

    var ext = direction === 'encode' ? '.b64.txt' : '.decoded.txt';
    downloadText(text, 'value-codes-base64' + ext);
    setStatus('success', '✓', 'File downloaded.');
  });


  /* ========================================================================
     FILE UPLOAD HANDLING
     ======================================================================== */

  /* Click zone to trigger file input */
  fileZone.addEventListener('click', function () {
    fileInput.click();
  });

  /* Drag & drop */
  fileZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    fileZone.classList.add('b64-file-zone-active');
  });

  fileZone.addEventListener('dragleave', function () {
    fileZone.classList.remove('b64-file-zone-active');
  });

  fileZone.addEventListener('drop', function (e) {
    e.preventDefault();
    fileZone.classList.remove('b64-file-zone-active');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  /* File input change */
  fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  /**
   * Process an uploaded file and encode it to Base64.
   */
  function handleFile(file) {
    if (file.size > MAX_FILE_SIZE) {
      setStatus('error', '✕', 'File too large — maximum size is 5 MB.');
      return;
    }

    fileName.textContent = file.name;
    fileMeta.textContent = formatBytes(file.size) + ' · ' + (file.type || 'unknown type');
    currentFileMime = file.type || 'application/octet-stream';

    fileInfo.classList.remove('b64-file-info-hidden');

    var reader = new FileReader();

    reader.onload = function (e) {
      var arrayBuffer = e.target.result;
      var bytes = new Uint8Array(arrayBuffer);
      var binary = '';
      for (var i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      var b64 = btoa(binary);
      currentFileData = b64;

      updateFileOutput();
      showFilePreview(file, b64);

      setStatus('success', '✓', 'File encoded — ' + formatBytes(file.size) + ' → ' + formatChars(b64.length));
    };

    reader.onerror = function () {
      setStatus('error', '✕', 'Failed to read file.');
    };

    reader.readAsArrayBuffer(file);
  }

  /**
   * Update the file output textarea with or without Data URI prefix.
   */
  function updateFileOutput() {
    if (!currentFileData) return;

    var output = currentFileData;
    if (dataUriCb.checked) {
      output = 'data:' + currentFileMime + ';base64,' + output;
    }

    fileOutputEl.value = output;
    fileOutputCount.textContent = formatChars(output.length);
    fileOutputWrap.classList.remove('b64-file-output-hidden');
  }

  /**
   * Show image preview if the file is an image type.
   */
  function showFilePreview(file, b64) {
    previewContainer.innerHTML = '';

    if (file.type && file.type.indexOf('image/') === 0) {
      var img = document.createElement('img');
      img.src = 'data:' + file.type + ';base64,' + b64;
      img.alt = 'Preview of ' + file.name;
      img.setAttribute('loading', 'lazy');
      previewContainer.appendChild(img);
      filePreview.classList.remove('b64-file-preview-hidden');
    } else {
      filePreview.classList.add('b64-file-preview-hidden');
    }
  }

  /* Data URI toggle */
  dataUriCb.addEventListener('change', updateFileOutput);

  /* Remove file */
  fileRemoveBtn.addEventListener('click', function () {
    currentFileData = null;
    currentFileMime = '';
    fileInput.value = '';
    fileInfo.classList.add('b64-file-info-hidden');
    fileOutputWrap.classList.add('b64-file-output-hidden');
    filePreview.classList.add('b64-file-preview-hidden');
    fileOutputEl.value = '';
    fileOutputCount.textContent = '0 chars';
    previewContainer.innerHTML = '';
    resetStatus();
  });

  /* Copy file Base64 */
  fileCopyBtn.addEventListener('click', function () {
    var text = fileOutputEl.value;
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        fileCopyBtn.classList.add('b64-action-btn-success');
        fileCopyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setStatus('success', '✓', 'File Base64 copied to clipboard!');

        setTimeout(function () {
          fileCopyBtn.classList.remove('b64-action-btn-success');
          fileCopyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy';
        }, 2000);
      }).catch(function () {
        fallbackCopy(fileOutputEl);
      });
    } else {
      fallbackCopy(fileOutputEl);
    }
  });

  /* Download file Base64 */
  fileDownloadBtn.addEventListener('click', function () {
    var text = fileOutputEl.value;
    if (!text) return;
    downloadText(text, 'value-codes-file-base64.txt');
    setStatus('success', '✓', 'File downloaded.');
  });


  /* ========================================================================
     DOWNLOAD HELPER
     ======================================================================== */

  /**
   * Trigger a text file download in the browser.
   */
  function downloadText(content, filename) {
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }


  /* ========================================================================
     FAQ ACCORDION
     ======================================================================== */

  faqQuestions.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var answer = btn.nextElementSibling;

      /* Close all others */
      faqQuestions.forEach(function (otherBtn) {
        if (otherBtn !== btn) {
          otherBtn.setAttribute('aria-expanded', 'false');
          otherBtn.nextElementSibling.classList.remove('tool-faq-answer-open');
          otherBtn.nextElementSibling.setAttribute('aria-hidden', 'true');
        }
      });

      /* Toggle current */
      var newState = !expanded;
      btn.setAttribute('aria-expanded', String(newState));
      answer.classList.toggle('tool-faq-answer-open', newState);
      answer.setAttribute('aria-hidden', String(!newState));
    });
  });


  /* ========================================================================
     KEYBOARD SHORTCUTS
     ======================================================================== */

  document.addEventListener('keydown', function (e) {
    /* Ctrl/Cmd + Enter to process */
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (document.activeElement === inputEl) {
        e.preventDefault();
        processText();
      }
    }

    /* Ctrl/Cmd + Shift + C to copy output */
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      copyBtn.click();
    }

    /* Ctrl/Cmd + Shift + S to swap */
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      swapBtn.click();
    }
  });


  /* ========================================================================
     INITIALIZATION
     ======================================================================== */

  resetStatus();

})();