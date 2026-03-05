/* ==========================================================================
   JSON FORMATTER v2.0 — Full Production Logic
   Value.Codes | public/js/tools/json-formatter.js

   Features:
   - Syntax highlighting (overlay)
   - Dark mode (system + manual toggle, persisted)
   - Undo/Redo history stack
   - Tab key support (insert/remove indent)
   - localStorage persistence
   - Performance guard (>1MB warning, >5MB block)
   - Diff view (line-by-line)
   - Tree view with JSON path + virtual-ish rendering
   - Robust JSON fix (handles nested quotes, comments, etc.)
   - Keyboard shortcuts
   - File I/O with drag-and-drop
   - Resizable panels
   ========================================================================== */

(function () {
  'use strict';

  /* ==========================================================================
     CONSTANTS
     ========================================================================== */

  var STORAGE_KEY = 'vc_jf_input';
  var THEME_KEY = 'vc_jf_theme';
  var MAX_FILE_SIZE = 5 * 1024 * 1024;    /* 5MB */
  var PERF_WARN_SIZE = 1 * 1024 * 1024;   /* 1MB */
  var HIGHLIGHT_LIMIT = 500000;            /* Skip highlighting above this char count */
  var TREE_NODE_LIMIT = 10000;             /* Max nodes before lazy message */
  var HISTORY_LIMIT = 50;
  var DEBOUNCE_MS = 250;
  var TOAST_MS = 2400;


  /* ==========================================================================
     DOM REFERENCES
     ========================================================================== */

  var $ = function (id) { return document.getElementById(id); };

  var input          = $('jf-input');
  var output         = $('jf-output');
  var hlInput        = $('jf-highlight-input');
  var hlOutput       = $('jf-highlight-output');
  var lineNumsInput  = $('jf-line-numbers-input');
  var lineNumsOutput = $('jf-line-numbers-output');
  var statusDot      = $('jf-status-dot');
  var statusText     = $('jf-status-text');
  var statusPath     = $('jf-status-path');
  var statusPerf     = $('jf-status-perf');
  var errorPanel     = $('jf-error-panel');
  var errorTitle     = $('jf-error-title');
  var errorMessage   = $('jf-error-message');
  var errorLocation  = $('jf-error-location');
  var perfWarning    = $('jf-perf-warning');
  var perfText       = $('jf-perf-text');
  var toastEl        = $('jf-toast');
  var toastText      = $('jf-toast-text');
  var toastIcon      = $('jf-toast-icon');
  var indentSelect   = $('indent-select');
  var fileInput      = $('file-input');
  var treeContainer  = $('jf-tree-container');
  var treeViewport   = $('jf-tree-viewport');
  var treePanel      = $('panel-tree');
  var treePathValue  = $('jf-tree-path-value');
  var treeSearch     = $('jf-tree-search');
  var diffPanel      = $('panel-diff');
  var diffContainer  = $('jf-diff-container');
  var diffStats      = $('jf-diff-stats');
  var panelsEl       = $('jf-panels');

  /* Stat elements */
  var statLines = $('stat-lines');
  var statSize  = $('stat-size');
  var statKeys  = $('stat-keys');
  var statDepth = $('stat-depth');

  /* Buttons */
  var btnFormat      = $('btn-format');
  var btnMinify      = $('btn-minify');
  var btnValidate    = $('btn-validate');
  var btnFix         = $('btn-fix');
  var btnDiff        = $('btn-diff');
  var btnCopy        = $('btn-copy');
  var btnCopyOutput  = $('btn-copy-output');
  var btnCopyPath    = $('btn-copy-path');
  var btnDownload    = $('btn-download');
  var btnUpload      = $('btn-upload');
  var btnClear       = $('btn-clear');
  var btnPaste       = $('btn-paste');
  var btnSample      = $('btn-sample');
  var btnWrapToggle  = $('btn-wrap-toggle');
  var btnErrorClose  = $('jf-error-close');
  var btnExpandAll   = $('btn-expand-all');
  var btnCollapseAll = $('btn-collapse-all');
  var btnDiffClose   = $('btn-diff-close');
  var btnUndo        = $('btn-undo');
  var btnRedo        = $('btn-redo');
  var btnTheme       = $('btn-theme');
  var btnPerfDismiss = $('jf-perf-dismiss');
  var tabEditor      = $('tab-editor');
  var tabTree        = $('tab-tree');
  var tabDiff        = $('tab-diff');
  var resizeHandle   = $('jf-resize-handle');


  /* ==========================================================================
     STATE
     ========================================================================== */

  var state = {
    currentView: 'editor',
    isWrapped: false,
    toastTimer: null,
    lastParsed: null,
    lastInputBeforeFix: '',         /* For diff */
    lastOutputForDiff: '',          /* For diff */
    isDarkMode: false,
    isLargeFile: false,
    highlightEnabled: true,
    history: [],
    historyIndex: -1,
    historyPaused: false
  };


  /* ==========================================================================
     SAMPLE DATA
     ========================================================================== */

  var sampleJSON = JSON.stringify({
    name: 'Value.Codes',
    type: 'Developer Tools',
    version: '2.0.0',
    tools: [
      'JSON Formatter',
      'Regex Builder',
      'Diff Checker',
      'Base64 Encoder',
      'Color Picker'
    ],
    compiler: {
      languages: 19,
      runtime: 'browser',
      features: ['syntax-highlight', 'auto-complete', 'multi-file']
    },
    community: {
      members: 2400,
      channels: ['general', 'javascript', 'python', 'rust-help'],
      isActive: true,
      moderators: null
    },
    pricing: {
      free: true,
      pro: {
        monthly: 9.99,
        yearly: 99.99,
        features: ['priority-support', 'ad-free', 'private-snippets']
      }
    },
    openSource: true,
    website: '<https://value.codes>'
  }, null, 2);


  /* ==========================================================================
     UTILITIES
     ========================================================================== */

  function getIndent() {
    var val = indentSelect.value;
    if (val === 'tab') return '\\t';
    return parseInt(val, 10);
  }

  function getIndentStr() {
    var val = indentSelect.value;
    if (val === 'tab') return '\\t';
    var n = parseInt(val, 10);
    var s = '';
    for (var i = 0; i < n; i++) s += ' ';
    return s;
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  function countKeys(obj) {
    var count = 0;
    if (obj && typeof obj === 'object') {
      var keys = Array.isArray(obj) ? obj : Object.keys(obj);
      if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) count += countKeys(obj[i]);
      } else {
        var k = Object.keys(obj);
        count += k.length;
        for (var j = 0; j < k.length; j++) count += countKeys(obj[k[j]]);
      }
    }
    return count;
  }

  function getDepth(obj) {
    if (!obj || typeof obj !== 'object') return 0;
    var max = 0;
    var items = Array.isArray(obj) ? obj : Object.keys(obj).map(function (k) { return obj[k]; });
    for (var i = 0; i < items.length; i++) {
      var d = getDepth(items[i]);
      if (d > max) max = d;
    }
    return max + 1;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function now() {
    return performance && performance.now ? performance.now() : Date.now();
  }


  /* ==========================================================================
     DARK MODE
     ========================================================================== */

  function initTheme() {
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark') {
      enableDark();
    } else if (saved === 'light') {
      enableLight();
    } else {
      /* System preference */
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        enableDark();
      } else {
        enableLight();
      }
    }
  }

  function enableDark() {
    document.documentElement.setAttribute('data-theme', 'dark');
    state.isDarkMode = true;
    localStorage.setItem(THEME_KEY, 'dark');
  }

  function enableLight() {
    document.documentElement.removeAttribute('data-theme');
    state.isDarkMode = false;
    localStorage.setItem(THEME_KEY, 'light');
  }

  function toggleTheme() {
    if (state.isDarkMode) {
      enableLight();
    } else {
      enableDark();
    }
    /* Re-highlight if content exists */
    if (input.value) highlightSyntax(input, hlInput);
    if (output.value) highlightSyntax(output, hlOutput);
  }

  /* Listen for system theme changes */
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      var saved = localStorage.getItem(THEME_KEY);
      if (!saved) {
        if (e.matches) enableDark(); else enableLight();
      }
    });
  }


  /* ==========================================================================
     SYNTAX HIGHLIGHTING
     ========================================================================== */

  /**
   * Tokenize JSON string into highlighted HTML
   * This is a simple tokenizer — not a full parser.
   * Works well for formatted/minified JSON.
   */
  function tokenizeJSON(text) {
    if (!text || text.length > HIGHLIGHT_LIMIT) return escapeHtml(text);

    var result = '';
    var i = 0;
    var len = text.length;
    var inString = false;
    var isKey = false;
    var afterColon = false;

    while (i < len) {
      var ch = text[i];

      if (ch === '"' && !inString) {
        /* Start of string — determine if key or value */
        var j = i + 1;
        while (j < len && text[j] !== '"') {
          if (text[j] === '\\\\') j++; /* Skip escaped char */
          j++;
        }
        var str = text.substring(i, j + 1);
        var escaped = escapeHtml(str);

        /* Look ahead after string to see if followed by : */
        var k = j + 1;
        while (k < len && (text[k] === ' ' || text[k] === '\\t' || text[k] === '\\n' || text[k] === '\\r')) k++;

        if (text[k] === ':') {
          result += '<span class="jf-hl-key">' + escaped + '</span>';
        } else {
          result += '<span class="jf-hl-string">' + escaped + '</span>';
        }
        i = j + 1;
        afterColon = false;
        continue;
      }

      if (ch === ':') {
        result += '<span class="jf-hl-colon">:</span>';
        afterColon = true;
        i++;
        continue;
      }

      if (ch === ',') {
        result += '<span class="jf-hl-comma">,</span>';
        afterColon = false;
        i++;
        continue;
      }

      if (ch === '{' || ch === '}' || ch === '[' || ch === ']') {
        result += '<span class="jf-hl-bracket">' + ch + '</span>';
        afterColon = false;
        i++;
        continue;
      }

      /* Numbers */
      if (ch === '-' || (ch >= '0' && ch <= '9')) {
        var numStart = i;
        if (ch === '-') i++;
        while (i < len && ((text[i] >= '0' && text[i] <= '9') || text[i] === '.' || text[i] === 'e' || text[i] === 'E' || text[i] === '+' || text[i] === '-')) i++;
        var numStr = text.substring(numStart, i);
        if (!isNaN(Number(numStr))) {
          result += '<span class="jf-hl-number">' + escapeHtml(numStr) + '</span>';
          continue;
        }
        /* Not a valid number, output as-is */
        result += escapeHtml(numStr);
        continue;
      }

      /* Booleans */
      if (text.substring(i, i + 4) === 'true') {
        result += '<span class="jf-hl-boolean">true</span>';
        i += 4;
        continue;
      }
      if (text.substring(i, i + 5) === 'false') {
        result += '<span class="jf-hl-boolean">false</span>';
        i += 5;
        continue;
      }

      /* Null */
      if (text.substring(i, i + 4) === 'null') {
        result += '<span class="jf-hl-null">null</span>';
        i += 4;
        continue;
      }

      /* Whitespace and other */
      if (ch === '\\n') {
        result += '\\n';
      } else {
        result += escapeHtml(ch);
      }
      i++;
    }

    return result;
  }

  /**
   * Apply syntax highlighting to a textarea's overlay layer
   */
  function highlightSyntax(textarea, overlay) {
    if (!state.highlightEnabled || !overlay) return;
    var text = textarea.value;
    if (text.length > HIGHLIGHT_LIMIT) {
      overlay.innerHTML = '';
      textarea.classList.add('jf-textarea-no-highlight');
      return;
    }
    textarea.classList.remove('jf-textarea-no-highlight');
    overlay.innerHTML = tokenizeJSON(text);
  }

  /**
   * Sync scroll of overlay with textarea
   */
  function syncHighlightScroll(textarea, overlay) {
    if (overlay) {
      overlay.scrollTop = textarea.scrollTop;
      overlay.scrollLeft = textarea.scrollLeft;
    }
  }


  /* ==========================================================================
     LINE NUMBERS
     ========================================================================== */

  function updateLineNumbers(textarea, container) {
    var text = textarea.value;
    var lines = text ? text.split('\\n').length : 1;
    var html = '';
    for (var i = 1; i <= lines; i++) {
      html += '<span class="jf-line-number">' + i + '</span>';
    }
    container.innerHTML = html;
  }

  function syncLineScroll(textarea, container) {
    container.scrollTop = textarea.scrollTop;
  }


  /* ==========================================================================
     STATS
     ========================================================================== */

  function updateStats(text, parsed) {
    var lines = text ? text.split('\\n').length : 0;
    var size = text ? new Blob([text]).size : 0;
    var keys = parsed !== null ? countKeys(parsed) : 0;
    var depth = parsed !== null ? getDepth(parsed) : 0;

    statLines.querySelector('span').textContent = lines + ' line' + (lines !== 1 ? 's' : '');
    statSize.querySelector('span').textContent = formatBytes(size);
    statKeys.querySelector('span').textContent = keys + ' key' + (keys !== 1 ? 's' : '');
    statDepth.querySelector('span').textContent = 'Depth: ' + depth;
  }


  /* ==========================================================================
     STATUS BAR
     ========================================================================== */

  function setStatus(type, message) {
    statusDot.className = 'jf-status-dot jf-status-dot-' + type;
    statusText.className = 'jf-status-text';
    if (type !== 'idle') statusText.classList.add('jf-status-text-' + type);
    statusText.textContent = message;
  }

  function setPerf(ms) {
    if (ms > 0) {
      statusPerf.textContent = ms.toFixed(0) + 'ms';
    } else {
      statusPerf.textContent = '';
    }
  }


  /* ==========================================================================
     PERFORMANCE GUARD
     ========================================================================== */

  function checkPerformance(text) {
    var size = new Blob([text]).size;
    if (size > MAX_FILE_SIZE) {
      showToast('File exceeds 5MB limit', 'error');
      return false;
    }
    if (size > PERF_WARN_SIZE) {
      state.isLargeFile = true;
      state.highlightEnabled = false;
      perfWarning.classList.remove('jf-perf-warning-hidden');
      perfText.textContent = 'Large file (' + formatBytes(size) + '). Syntax highlighting disabled for performance.';
      /* Remove highlight overlays */
      hlInput.innerHTML = '';
      hlOutput.innerHTML = '';
      input.classList.add('jf-textarea-no-highlight');
      output.classList.add('jf-textarea-no-highlight');
    } else {
      state.isLargeFile = false;
      state.highlightEnabled = true;
      perfWarning.classList.add('jf-perf-warning-hidden');
      input.classList.remove('jf-textarea-no-highlight');
      output.classList.remove('jf-textarea-no-highlight');
    }
    return true;
  }


  /* ==========================================================================
     TOAST
     ========================================================================== */

  function showToast(message, type) {
    if (state.toastTimer) clearTimeout(state.toastTimer);
    toastText.textContent = message;
    toastEl.className = 'jf-toast jf-toast-visible';
    if (type === 'success') toastEl.classList.add('jf-toast-success');
    if (type === 'error') toastEl.classList.add('jf-toast-error');
    toastIcon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    state.toastTimer = setTimeout(function () {
      toastEl.classList.remove('jf-toast-visible');
      toastEl.classList.add('jf-toast-hidden');
    }, TOAST_MS);
  }


  /* ==========================================================================
     ERROR PANEL
     ========================================================================== */

  function showError(err, inputText) {
    errorPanel.classList.remove('jf-error-panel-hidden');
    errorTitle.textContent = 'JSON Parse Error';
    errorMessage.textContent = err.message;

    var posMatch = err.message.match(/position\\s+(\\d+)/i) ||
                   err.message.match(/at\\s+(\\d+)/i) ||
                   err.message.match(/column\\s+(\\d+)/i);

    if (posMatch && inputText) {
      var pos = parseInt(posMatch[1], 10);
      var start = Math.max(0, pos - 40);
      var end = Math.min(inputText.length, pos + 40);
      var snippet = inputText.substring(start, end);
      var pointer = '';
      var offset = pos - start;
      for (var p = 0; p < offset; p++) pointer += ' ';
      pointer += '^^^';
      errorLocation.textContent = snippet + '\\n' + pointer;
    } else {
      errorLocation.textContent = '';
    }
  }

  function hideError() {
    errorPanel.classList.add('jf-error-panel-hidden');
  }


  /* ==========================================================================
     UNDO / REDO
     ========================================================================== */

  function pushHistory(text) {
    if (state.historyPaused) return;
    /* Remove future entries if we're not at the end */
    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1);
    }
    /* Don't push duplicate */
    if (state.history.length > 0 && state.history[state.history.length - 1] === text) return;
    state.history.push(text);
    if (state.history.length > HISTORY_LIMIT) {
      state.history.shift();
    }
    state.historyIndex = state.history.length - 1;
    updateUndoRedoButtons();
  }

  function undo() {
    if (state.historyIndex <= 0) return;
    state.historyIndex--;
    state.historyPaused = true;
    input.value = state.history[state.historyIndex];
    state.historyPaused = false;
    refreshInputUI();
    showToast('Undo', '');
  }

  function redo() {
    if (state.historyIndex >= state.history.length - 1) return;
    state.historyIndex++;
    state.historyPaused = true;
    input.value = state.history[state.historyIndex];
    state.historyPaused = false;
    refreshInputUI();
    showToast('Redo', '');
  }

  function updateUndoRedoButtons() {
    btnUndo.disabled = state.historyIndex <= 0;
    btnRedo.disabled = state.historyIndex >= state.history.length - 1;
  }

  function refreshInputUI() {
    updateLineNumbers(input, lineNumsInput);
    highlightSyntax(input, hlInput);
    lightValidate();
    updateUndoRedoButtons();
    saveToStorage();
  }


  /* ==========================================================================
     LOCAL STORAGE PERSISTENCE
     ========================================================================== */

  function saveToStorage() {
    try {
      var text = input.value;
      if (text && text.length < 2 * 1024 * 1024) { /* Only save <2MB */
        localStorage.setItem(STORAGE_KEY, text);
      }
    } catch (e) { /* Storage full or disabled — silently fail */ }
  }

  function loadFromStorage() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved.trim()) {
        input.value = saved;
        pushHistory(saved);
        return true;
      }
    } catch (e) { /* Silently fail */ }
    return false;
  }


  /* ==========================================================================
     ROBUST JSON FIX
     ========================================================================== */

  /**
   * Attempts to fix common JSON issues using a character-by-character approach.
   * Much more robust than regex-only.
   */
  function fixJSON(text) {
    if (!text || !text.trim()) return text;

    var result = text;

    /* Phase 1: Remove comments */
    result = removeJSONComments(result);

    /* Phase 2: Fix quotes and keys */
    result = fixQuotesAndKeys(result);

    /* Phase 3: Remove trailing commas */
    result = removeTrailingCommas(result);

    /* Phase 4: Try to parse, if still fails try wrapping */
    try {
      JSON.parse(result);
      return result;
    } catch (e) {
      /* Last resort — try adding missing brackets */
      result = tryFixBrackets(result);
    }

    return result;
  }

  function removeJSONComments(text) {
    var result = '';
    var i = 0;
    var inString = false;
    var len = text.length;

    while (i < len) {
      /* Track string state */
      if (text[i] === '"' && (i === 0 || text[i - 1] !== '\\\\')) {
        inString = !inString;
        result += text[i];
        i++;
        continue;
      }

      if (!inString) {
        /* Single-line comment */
        if (text[i] === '/' && text[i + 1] === '/') {
          while (i < len && text[i] !== '\\n') i++;
          continue;
        }
        /* Multi-line comment */
        if (text[i] === '/' && text[i + 1] === '*') {
          i += 2;
          while (i < len && !(text[i] === '*' && text[i + 1] === '/')) i++;
          i += 2;
          continue;
        }
      }

      result += text[i];
      i++;
    }

    return result;
  }

  function fixQuotesAndKeys(text) {
    var result = '';
    var i = 0;
    var len = text.length;

    while (i < len) {
      var ch = text[i];

      /* Convert single-quoted strings to double-quoted */
      if (ch === "'") {
        result += '"';
        i++;
        while (i < len && text[i] !== "'") {
          if (text[i] === '\\\\' && text[i + 1] === "'") {
            result += "'";
            i += 2;
          } else if (text[i] === '"') {
            result += '\\\\"';
            i++;
          } else {
            result += text[i];
            i++;
          }
        }
        result += '"';
        i++; /* Skip closing single quote */
        continue;
      }

      /* Unquoted keys: word followed by : */
      if (ch !== '"' && ch !== '{' && ch !== '}' && ch !== '[' && ch !== ']' &&
          ch !== ':' && ch !== ',' && ch !== ' ' && ch !== '\\t' && ch !== '\\n' &&
          ch !== '\\r') {
        /* Check if this looks like an unquoted key */
        var wordStart = i;
        while (i < len && /[a-zA-Z0-9_$]/.test(text[i])) i++;
        var word = text.substring(wordStart, i);

        /* Skip whitespace */
        var j = i;
        while (j < len && (text[j] === ' ' || text[j] === '\\t')) j++;

        if (text[j] === ':' && word !== 'true' && word !== 'false' && word !== 'null' && isNaN(Number(word))) {
          result += '"' + word + '"';
          continue;
        }

        /* Not a key, just output the word */
        result += word;
        continue;
      }

      result += ch;
      i++;
    }

    return result;
  }

  function removeTrailingCommas(text) {
    /* Remove commas before } or ] accounting for whitespace */
    return text.replace(/,(\\s*[}\\]])/g, '$1');
  }

  function tryFixBrackets(text) {
    var trimmed = text.trim();
    var opens = 0;
    var closes = 0;
    var arrayOpens = 0;
    var arrayCloses = 0;
    var inString = false;

    for (var i = 0; i < trimmed.length; i++) {
      if (trimmed[i] === '"' && (i === 0 || trimmed[i - 1] !== '\\\\')) inString = !inString;
      if (!inString) {
        if (trimmed[i] === '{') opens++;
        if (trimmed[i] === '}') closes++;
        if (trimmed[i] === '[') arrayOpens++;
        if (trimmed[i] === ']') arrayCloses++;
      }
    }

    while (closes < opens) { trimmed += '}'; closes++; }
    while (arrayCloses < arrayOpens) { trimmed += ']'; arrayCloses++; }

    return trimmed;
  }


  /* ==========================================================================
     CORE OPERATIONS
     ========================================================================== */

  function formatJSON() {
    var raw = input.value.trim();
    if (!raw) {
      setStatus('idle', 'Paste or type JSON to get started');
      output.value = '';
      state.lastParsed = null;
      hideError();
      updateAll('', null);
      return;
    }

    if (!checkPerformance(raw)) return;

    var t0 = now();
    try {
      var parsed = JSON.parse(raw);
      var formatted = JSON.stringify(parsed, null, getIndent());
      output.value = formatted;
      state.lastParsed = parsed;
      state.lastOutputForDiff = formatted;
      var elapsed = now() - t0;

      setStatus('valid', 'Valid JSON — formatted successfully');
      setPerf(elapsed);
      hideError();
      updateAll(formatted, parsed);
      pushHistory(raw);
      saveToStorage();
      if (state.currentView === 'tree') buildTree(parsed);
      showToast('Formatted successfully', 'success');
    } catch (err) {
      setStatus('error', 'Invalid JSON');
      setPerf(0);
      showError(err, raw);
      state.lastParsed = null;
      updateStats(raw, null);
    }
  }

  function minifyJSON() {
    var raw = input.value.trim();
    if (!raw) return;
    if (!checkPerformance(raw)) return;

    var t0 = now();
    try {
      var parsed = JSON.parse(raw);
      var minified = JSON.stringify(parsed);
      output.value = minified;
      state.lastParsed = parsed;
      state.lastOutputForDiff = minified;
      var elapsed = now() - t0;

      setStatus('valid', 'Valid JSON — minified');
      setPerf(elapsed);
      hideError();
      updateAll(minified, parsed);
      pushHistory(raw);
      saveToStorage();
      showToast('Minified (' + formatBytes(new Blob([minified]).size) + ')', 'success');
    } catch (err) {
      setStatus('error', 'Invalid JSON — cannot minify');
      setPerf(0);
      showError(err, raw);
    }
  }

  function validateJSON() {
    var raw = input.value.trim();
    if (!raw) {
      setStatus('idle', 'Nothing to validate');
      return;
    }

    var t0 = now();
    try {
      var parsed = JSON.parse(raw);
      var elapsed = now() - t0;
      state.lastParsed = parsed;
      setStatus('valid', 'Valid JSON ✓');
      setPerf(elapsed);
      hideError();
      updateStats(raw, parsed);
      showToast('Valid JSON', 'success');
    } catch (err) {
      setStatus('error', 'Invalid JSON');
      setPerf(0);
      showError(err, raw);
      state.lastParsed = null;
      showToast('Invalid JSON', 'error');
    }
  }

  function fixAndFormat() {
    var raw = input.value.trim();
    if (!raw) return;

    state.lastInputBeforeFix = raw;

    /* First try as-is */
    try {
      JSON.parse(raw);
      showToast('JSON is already valid', 'success');
      formatJSON();
      return;
    } catch (_) { /* Needs fixing */ }

    var t0 = now();
    var fixed = fixJSON(raw);

    try {
      var parsed = JSON.parse(fixed);
      var formatted = JSON.stringify(parsed, null, getIndent());
      var elapsed = now() - t0;

      input.value = fixed;
      output.value = formatted;
      state.lastParsed = parsed;
      state.lastOutputForDiff = formatted;

      setStatus('warning', 'JSON fixed and formatted — use Diff to review changes');
      setPerf(elapsed);
      hideError();
      updateAll(formatted, parsed);
      pushHistory(fixed);
      saveToStorage();
      if (state.currentView === 'tree') buildTree(parsed);
      showToast('JSON fixed — review with Diff view', 'success');
    } catch (err) {
      setStatus('error', 'Unable to auto-fix — errors too severe');
      setPerf(0);
      showError(err, fixed);
      showToast('Could not auto-fix', 'error');
    }
  }

  function updateAll(outputText, parsed) {
    updateLineNumbers(input, lineNumsInput);
    updateLineNumbers(output, lineNumsOutput);
    highlightSyntax(input, hlInput);
    highlightSyntax(output, hlOutput);
    updateStats(outputText || input.value, parsed);
    updateUndoRedoButtons();
  }


  /* ==========================================================================
     DIFF VIEW
     ========================================================================== */

  function showDiff() {
    var original = state.lastInputBeforeFix || input.value;
    var formatted = output.value;

    if (!formatted) {
      showToast('Format or fix JSON first to see diff', 'error');
      return;
    }

    var oldLines = original.split('\\n');
    var newLines = formatted.split('\\n');

    /* Simple LCS-based diff */
    var diff = computeDiff(oldLines, newLines);

    /* Render */
    renderDiff(diff);

    /* Switch to diff tab */
    switchToDiff();
  }

  /**
   * Simple diff algorithm using longest common subsequence
   */
  function computeDiff(oldArr, newArr) {
    var result = [];
    var oldIdx = 0;
    var newIdx = 0;
    var added = 0;
    var removed = 0;

    /* Build a simple LCS table for small diffs, fallback to line-by-line for large */
    if (oldArr.length + newArr.length > 5000) {
      /* Large diff — simple approach */
      return simpleDiff(oldArr, newArr);
    }

    var lcs = buildLCS(oldArr, newArr);
    var seq = backtrackLCS(lcs, oldArr, newArr);

    var seqIdx = 0;
    oldIdx = 0;
    newIdx = 0;

    while (oldIdx < oldArr.length || newIdx < newArr.length) {
      if (seqIdx < seq.length && oldIdx === seq[seqIdx][0] && newIdx === seq[seqIdx][1]) {
        result.push({ type: 'neutral', oldNum: oldIdx + 1, newNum: newIdx + 1, text: oldArr[oldIdx] });
        oldIdx++;
        newIdx++;
        seqIdx++;
      } else if (oldIdx < oldArr.length && (seqIdx >= seq.length || oldIdx < seq[seqIdx][0])) {
        result.push({ type: 'remove', oldNum: oldIdx + 1, newNum: null, text: oldArr[oldIdx] });
        removed++;
        oldIdx++;
      } else if (newIdx < newArr.length && (seqIdx >= seq.length || newIdx < seq[seqIdx][1])) {
        result.push({ type: 'add', oldNum: null, newNum: newIdx + 1, text: newArr[newIdx] });
        added++;
        newIdx++;
      } else {
        break;
      }
    }

    state.diffAdded = added;
    state.diffRemoved = removed;
    return result;
  }

  function simpleDiff(oldArr, newArr) {
    var result = [];
    var maxLen = Math.max(oldArr.length, newArr.length);
    var added = 0;
    var removed = 0;

    for (var i = 0; i < maxLen; i++) {
      if (i < oldArr.length && i < newArr.length) {
        if (oldArr[i] === newArr[i]) {
          result.push({ type: 'neutral', oldNum: i + 1, newNum: i + 1, text: oldArr[i] });
        } else {
          result.push({ type: 'remove', oldNum: i + 1, newNum: null, text: oldArr[i] });
          result.push({ type: 'add', oldNum: null, newNum: i + 1, text: newArr[i] });
          added++;
          removed++;
        }
      } else if (i < oldArr.length) {
        result.push({ type: 'remove', oldNum: i + 1, newNum: null, text: oldArr[i] });
        removed++;
      } else {
        result.push({ type: 'add', oldNum: null, newNum: i + 1, text: newArr[i] });
        added++;
      }
    }

    state.diffAdded = added;
    state.diffRemoved = removed;
    return result;
  }

  function buildLCS(a, b) {
    var m = a.length;
    var n = b.length;
    var dp = [];
    for (var i = 0; i <= m; i++) {
      dp[i] = [];
      for (var j = 0; j <= n; j++) {
        if (i === 0 || j === 0) dp[i][j] = 0;
        else if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    return dp;
  }

  function backtrackLCS(dp, a, b) {
    var result = [];
    var i = a.length;
    var j = b.length;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        result.unshift([i - 1, j - 1]);
        i--;
        j--;
      } else if (dp[i - 1][j] > dp[i][j - 1]) {
        i--;
      } else {
        j--;
      }
    }
    return result;
  }

  function renderDiff(diff) {
    if (!diff || diff.length === 0) {
      diffContainer.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--jf-muted);">No differences found.</div>';
      diffStats.textContent = '';
      return;
    }

    var html = '';
    for (var i = 0; i < diff.length; i++) {
      var d = diff[i];
      var lineClass = 'jf-diff-line jf-diff-line-' + d.type;
      var prefix = d.type === 'add' ? '+' : d.type === 'remove' ? '-' : ' ';
      var oldNum = d.oldNum !== null ? d.oldNum : '';
      var newNum = d.newNum !== null ? d.newNum : '';

      html += '<div class="' + lineClass + '">'
        + '<div class="jf-diff-gutter jf-diff-gutter-old">' + oldNum + '</div>'
        + '<div class="jf-diff-gutter">' + newNum + '</div>'
        + '<div class="jf-diff-content"><span class="jf-diff-prefix">' + prefix + '</span>' + escapeHtml(d.text) + '</div>'
        + '</div>';
    }

    diffContainer.innerHTML = html;
    diffStats.textContent = '+' + (state.diffAdded || 0) + ' / -' + (state.diffRemoved || 0) + ' lines';
  }


  /* ==========================================================================
     TREE VIEW
     ========================================================================== */

  var treeNodeCount = 0;

  function buildTree(data) {
    treeContainer.innerHTML = '';
    treeNodeCount = 0;

    if (data === null || data === undefined) {
      treeContainer.innerHTML = '<div style="padding:1rem;color:var(--jf-muted);">No data to display.</div>';
      return;
    }

    /* Check node count */
    var keyCount = countKeys(data);
    if (keyCount > TREE_NODE_LIMIT) {
      treeContainer.innerHTML = '<div style="padding:1rem;color:var(--jf-muted);">'
        + '<strong>Large JSON detected (' + keyCount + ' keys).</strong><br>'
        + 'Tree view shows the first level only. Use the editor for full inspection.'
        + '</div>';
      /* Build shallow tree */
      var shallow = createTreeNode('root', data, '$', true, 2);
      treeContainer.innerHTML = '';
      treeContainer.appendChild(shallow);
      return;
    }

    var root = createTreeNode('root', data, '$', true, Infinity);
    treeContainer.appendChild(root);
  }

  function createTreeNode(key, value, path, isRoot, maxDepth) {
    treeNodeCount++;
    var wrapper = document.createElement('div');

    if (maxDepth <= 0 && value !== null && typeof value === 'object') {
      /* Truncated node */
      var truncRow = document.createElement('div');
      truncRow.className = 'jf-tree-row';
      truncRow.innerHTML = '<span class="jf-tree-toggle-placeholder"></span>'
        + '<span class="jf-tree-key">' + escapeHtml(String(key)) + '</span>'
        + '<span class="jf-tree-colon">: </span>'
        + '<span class="jf-tree-bracket">' + (Array.isArray(value) ? '[…]' : '{…}') + '</span>'
        + '<span class="jf-tree-count">' + (Array.isArray(value) ? value.length : Object.keys(value).length) + ' items</span>';
      wrapper.appendChild(truncRow);
      return wrapper;
    }

    if (value !== null && typeof value === 'object') {
      var isArray = Array.isArray(value);
      var children = isArray ? value : Object.keys(value);
      var count = isArray ? value.length : children.length;

      var row = document.createElement('div');
      row.className = 'jf-tree-row';
      row.setAttribute('data-path', path);

      var toggle = document.createElement('button');
      toggle.className = 'jf-tree-toggle';
      toggle.type = 'button';
      toggle.setAttribute('aria-label', 'Toggle');
      toggle.textContent = '▼';
      row.appendChild(toggle);

      if (!isRoot) {
        var keySpan = document.createElement('span');
        keySpan.className = 'jf-tree-key';
        keySpan.textContent = isArray ? '' : '"' + key + '"';
        if (!isArray) {
          row.appendChild(keySpan);
          var colon = document.createElement('span');
          colon.className = 'jf-tree-colon';
          colon.textContent = ': ';
          row.appendChild(colon);
        }
      }

      var bracket = document.createElement('span');
      bracket.className = 'jf-tree-bracket';
      bracket.textContent = isArray ? '[' : '{';

      var countSpan = document.createElement('span');
      countSpan.className = 'jf-tree-count';
      countSpan.textContent = count + ' item' + (count !== 1 ? 's' : '');

      row.appendChild(bracket);
      row.appendChild(countSpan);

      /* Click to show path */
      row.addEventListener('click', function (e) {
        if (e.target === toggle) return;
        setTreePath(path);
      });

      wrapper.appendChild(row);

      var childContainer = document.createElement('div');
      childContainer.className = 'jf-tree-node';

      if (isArray) {
        for (var ai = 0; ai < value.length; ai++) {
          childContainer.appendChild(createTreeNode(ai, value[ai], path + '[' + ai + ']', false, maxDepth - 1));
        }
      } else {
        for (var ci = 0; ci < children.length; ci++) {
          var childKey = children[ci];
          var childPath = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(childKey)
            ? path + '.' + childKey
            : path + '["' + childKey + '"]';
          childContainer.appendChild(createTreeNode(childKey, value[childKey], childPath, false, maxDepth - 1));
        }
      }

      var closeBracket = document.createElement('div');
      closeBracket.className = 'jf-tree-row';
      var ph = document.createElement('span');
      ph.className = 'jf-tree-toggle-placeholder';
      var cls = document.createElement('span');
      cls.className = 'jf-tree-bracket';
      cls.textContent = isArray ? ']' : '}';
      closeBracket.appendChild(ph);
      closeBracket.appendChild(cls);

      wrapper.appendChild(childContainer);
      wrapper.appendChild(closeBracket);

      toggle.addEventListener('click', function () {
        var hidden = childContainer.classList.toggle('jf-tree-children-hidden');
        closeBracket.classList.toggle('jf-tree-children-hidden', hidden);
        toggle.classList.toggle('jf-tree-toggle-collapsed', hidden);
        toggle.textContent = hidden ? '▶' : '▼';
        countSpan.textContent = hidden
          ? count + ' item' + (count !== 1 ? 's' : '') + ' …'
          : count + ' item' + (count !== 1 ? 's' : '');
      });

    } else {
      /* Leaf */
      var leafRow = document.createElement('div');
      leafRow.className = 'jf-tree-row';
      leafRow.setAttribute('data-path', path);

      var leafPh = document.createElement('span');
      leafPh.className = 'jf-tree-toggle-placeholder';
      leafRow.appendChild(leafPh);

      if (key !== null && key !== undefined && typeof key !== 'number') {
        var lk = document.createElement('span');
        lk.className = 'jf-tree-key';
        lk.textContent = '"' + key + '"';
        var lc = document.createElement('span');
        lc.className = 'jf-tree-colon';
        lc.textContent = ': ';
        leafRow.appendChild(lk);
        leafRow.appendChild(lc);
      }

      var valSpan = document.createElement('span');
      if (typeof value === 'string') {
        valSpan.className = 'jf-tree-string';
        valSpan.textContent = '"' + value + '"';
      } else if (typeof value === 'number') {
        valSpan.className = 'jf-tree-number';
        valSpan.textContent = String(value);
      } else if (typeof value === 'boolean') {
        valSpan.className = 'jf-tree-boolean';
        valSpan.textContent = String(value);
      } else {
        valSpan.className = 'jf-tree-null';
        valSpan.textContent = 'null';
      }

      leafRow.appendChild(valSpan);

      leafRow.addEventListener('click', function () {
        setTreePath(path);
      });

      wrapper.appendChild(leafRow);
    }

    return wrapper;
  }

  function setTreePath(path) {
    treePathValue.textContent = path;
    statusPath.textContent = path;

    /* Highlight active row */
    var rows = treeContainer.querySelectorAll('.jf-tree-row-active');
    for (var i = 0; i < rows.length; i++) rows[i].classList.remove('jf-tree-row-active');
    var matching = treeContainer.querySelectorAll('[data-path="' + path + '"]');
    for (var m = 0; m < matching.length; m++) matching[m].classList.add('jf-tree-row-active');
  }

  function expandAllNodes() {
    var hidden = treeContainer.querySelectorAll('.jf-tree-children-hidden');
    for (var i = 0; i < hidden.length; i++) hidden[i].classList.remove('jf-tree-children-hidden');
    var toggles = treeContainer.querySelectorAll('.jf-tree-toggle-collapsed');
    for (var t = 0; t < toggles.length; t++) {
      toggles[t].classList.remove('jf-tree-toggle-collapsed');
      toggles[t].textContent = '▼';
    }
  }

  function collapseAllNodes() {
    var nodes = treeContainer.querySelectorAll('.jf-tree-node');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].classList.add('jf-tree-children-hidden');
      if (nodes[i].nextElementSibling && nodes[i].nextElementSibling.classList.contains('jf-tree-row')) {
        nodes[i].nextElementSibling.classList.add('jf-tree-children-hidden');
      }
    }
    var toggles = treeContainer.querySelectorAll('.jf-tree-toggle');
    for (var t = 0; t < toggles.length; t++) {
      toggles[t].classList.add('jf-tree-toggle-collapsed');
      toggles[t].textContent = '▶';
    }
  }

  function searchTree(query) {
    var rows = treeContainer.querySelectorAll('.jf-tree-row');
    for (var i = 0; i < rows.length; i++) rows[i].classList.remove('jf-tree-row-highlight');
    if (!query) return;

    var lowerQ = query.toLowerCase();
    for (var r = 0; r < rows.length; r++) {
      var text = rows[r].textContent.toLowerCase();
      if (text.indexOf(lowerQ) !== -1) {
        rows[r].classList.add('jf-tree-row-highlight');
        /* Ensure ancestors are expanded */
        var parent = rows[r].parentElement;
        while (parent && parent !== treeContainer) {
          if (parent.classList.contains('jf-tree-children-hidden')) {
            parent.classList.remove('jf-tree-children-hidden');
            if (parent.nextElementSibling) parent.nextElementSibling.classList.remove('jf-tree-children-hidden');
            var prev = parent.previousElementSibling;
            if (prev) {
              var tog = prev.querySelector('.jf-tree-toggle');
              if (tog) { tog.classList.remove('jf-tree-toggle-collapsed'); tog.textContent = '▼'; }
            }
          }
          parent = parent.parentElement;
        }
      }
    }
  }


  /* ==========================================================================
     CLIPBOARD
     ========================================================================== */

  function copyToClipboard(text, label) {
    if (!text) {
      showToast('Nothing to copy', 'error');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast((label || 'Copied') + ' to clipboard', 'success');
      }).catch(function () {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  }

  function fallbackCopy(text, label) {
    /* No deprecated execCommand — clipboard API is the only path */
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        showToast((label || 'Copied') + ' to clipboard', 'success');
      }).catch(function () {
        showToast('Copy failed', 'error');
      });
    } else {
      showToast('Copy not supported in this browser', 'error');
    }
  }

  function pasteFromClipboard() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(function (text) {
        input.value = text;
        pushHistory(text);
        refreshInputUI();
        formatJSON();
        showToast('Pasted from clipboard', 'success');
      }).catch(function () {
        showToast('Clipboard access denied', 'error');
      });
    } else {
      showToast('Clipboard API not supported', 'error');
    }
  }


  /* ==========================================================================
     FILE I/O
     ========================================================================== */

  function downloadJSON() {
    var text = output.value;
    if (!text) { showToast('Nothing to download', 'error'); return; }
    var blob = new Blob([text], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded formatted.json', 'success');
  }

  function handleFileUpload(e) {
    var file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      showToast('File too large (max 5MB)', 'error');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (ev) {
      input.value = ev.target.result;
      pushHistory(ev.target.result);
      refreshInputUI();
      formatJSON();
      showToast('Loaded: ' + file.name, 'success');
    };
    reader.onerror = function () {
      showToast('Failed to read file', 'error');
    };
    reader.readAsText(file);
    fileInput.value = '';
  }


  /* ==========================================================================
     TAB KEY SUPPORT
     ========================================================================== */

  function handleTabKey(e) {
    if (e.target !== input) return;
    if (e.key !== 'Tab') return;

    e.preventDefault();
    var start = input.selectionStart;
    var end = input.selectionEnd;
    var value = input.value;
    var indent = getIndentStr();

    if (e.shiftKey) {
      /* Remove indent from start of current line */
      var lineStart = value.lastIndexOf('\\n', start - 1) + 1;
      var lineText = value.substring(lineStart);

      if (lineText.startsWith(indent)) {
        input.value = value.substring(0, lineStart) + value.substring(lineStart + indent.length);
        input.selectionStart = input.selectionEnd = Math.max(lineStart, start - indent.length);
      }
    } else {
      /* Insert indent at cursor */
      input.value = value.substring(0, start) + indent + value.substring(end);
      input.selectionStart = input.selectionEnd = start + indent.length;
    }

    pushHistory(input.value);
    refreshInputUI();
  }


  /* ==========================================================================
     VIEW TABS
     ========================================================================== */

  function switchToEditor() {
    state.currentView = 'editor';
    setActiveTab(tabEditor);
    panelsEl.classList.remove('jf-panels-hidden');
    treePanel.classList.add('jf-tree-panel-hidden');
    diffPanel.classList.add('jf-diff-panel-hidden');
  }

  function switchToTree() {
    state.currentView = 'tree';
    setActiveTab(tabTree);
    panelsEl.classList.add('jf-panels-hidden');
    treePanel.classList.remove('jf-tree-panel-hidden');
    diffPanel.classList.add('jf-diff-panel-hidden');

    if (state.lastParsed !== null) {
      buildTree(state.lastParsed);
    } else {
      var raw = input.value.trim();
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          state.lastParsed = parsed;
          buildTree(parsed);
        } catch (_) {
          treeContainer.innerHTML = '<div style="padding:1rem;color:var(--jf-muted);">Parse JSON first to view tree.</div>';
        }
      }
    }
  }

  function switchToDiff() {
    state.currentView = 'diff';
    setActiveTab(tabDiff);
    panelsEl.classList.add('jf-panels-hidden');
    treePanel.classList.add('jf-tree-panel-hidden');
    diffPanel.classList.remove('jf-diff-panel-hidden');
  }

  function setActiveTab(activeTab) {
    var tabs = [tabEditor, tabTree, tabDiff];
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('jf-tab-active');
      tabs[i].setAttribute('aria-selected', 'false');
    }
    activeTab.classList.add('jf-tab-active');
    activeTab.setAttribute('aria-selected', 'true');
  }


  /* ==========================================================================
     CLEAR
     ========================================================================== */

  function clearAll() {
    pushHistory(input.value);
    input.value = '';
    output.value = '';
    state.lastParsed = null;
    state.lastInputBeforeFix = '';
    state.lastOutputForDiff = '';
    hideError();
    setStatus('idle', 'Paste or type JSON to get started');
    setPerf(0);
    updateAll('', null);
    treeContainer.innerHTML = '';
    treePathValue.textContent = '$';
    statusPath.textContent = '';
    perfWarning.classList.add('jf-perf-warning-hidden');
    state.isLargeFile = false;
    state.highlightEnabled = true;
    hlInput.innerHTML = '';
    hlOutput.innerHTML = '';
    saveToStorage();
    showToast('Cleared', 'success');
  }


  /* ==========================================================================
     WORD WRAP TOGGLE
     ========================================================================== */

  function toggleWrap() {
    state.isWrapped = !state.isWrapped;
    btnWrapToggle.setAttribute('aria-pressed', state.isWrapped ? 'true' : 'false');
    if (state.isWrapped) {
      output.classList.add('jf-textarea-wrapped');
    } else {
      output.classList.remove('jf-textarea-wrapped');
    }
  }


  /* ==========================================================================
     LIGHT VALIDATION (DEBOUNCED INPUT)
     ========================================================================== */

  function lightValidate() {
    var raw = input.value.trim();
    if (!raw) {
      setStatus('idle', 'Paste or type JSON to get started');
      hideError();
      state.lastParsed = null;
      updateStats('', null);
      return;
    }
    try {
      var parsed = JSON.parse(raw);
      setStatus('valid', 'Valid JSON');
      hideError();
      state.lastParsed = parsed;
      updateStats(raw, parsed);
    } catch (_) {
      setStatus('error', 'Invalid JSON');
      state.lastParsed = null;
      updateStats(raw, null);
    }
  }


  /* ==========================================================================
     RESIZE PANELS
     ========================================================================== */

  function initResize() {
    if (!resizeHandle || !panelsEl) return;

    var isResizing = false;
    var startX = 0;
    var startLeftWidth = 0;
    var panelsRect = null;

    resizeHandle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      isResizing = true;
      startX = e.clientX;
      panelsRect = panelsEl.getBoundingClientRect();
      var inputPanel = panelsEl.querySelector('.jf-panel-input');
      startLeftWidth = inputPanel ? inputPanel.getBoundingClientRect().width : panelsRect.width / 2;
      resizeHandle.classList.add('jf-resize-handle-active');
      document.body.classList.add('jf-resizing');
    });

    document.addEventListener('mousemove', function (e) {
      if (!isResizing) return;
      var dx = e.clientX - startX;
      var newLeft = startLeftWidth + dx;
      var totalWidth = panelsRect.width - 8;
      var minW = 200;
      if (newLeft < minW) newLeft = minW;
      if (newLeft > totalWidth - minW) newLeft = totalWidth - minW;
      var lp = (newLeft / totalWidth) * 100;
      panelsEl.style.gridTemplateColumns = lp + '% 8px ' + (100 - lp) + '%';
    });

    document.addEventListener('mouseup', function () {
      if (isResizing) {
        isResizing = false;
        resizeHandle.classList.remove('jf-resize-handle-active');
        document.body.classList.remove('jf-resizing');
      }
    });

    /* Touch support */
    resizeHandle.addEventListener('touchstart', function (e) {
      var touch = e.touches[0];
      isResizing = true;
      startX = touch.clientX;
      panelsRect = panelsEl.getBoundingClientRect();
      var inputPanel = panelsEl.querySelector('.jf-panel-input');
      startLeftWidth = inputPanel ? inputPanel.getBoundingClientRect().width : panelsRect.width / 2;
      resizeHandle.classList.add('jf-resize-handle-active');
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!isResizing) return;
      var touch = e.touches[0];
      var dx = touch.clientX - startX;
      var newLeft = startLeftWidth + dx;
      var totalWidth = panelsRect.width - 8;
      var minW = 200;
      if (newLeft < minW) newLeft = minW;
      if (newLeft > totalWidth - minW) newLeft = totalWidth - minW;
      var lp = (newLeft / totalWidth) * 100;
      panelsEl.style.gridTemplateColumns = lp + '% 8px ' + (100 - lp) + '%';
    }, { passive: true });

    document.addEventListener('touchend', function () {
      if (isResizing) {
        isResizing = false;
        resizeHandle.classList.remove('jf-resize-handle-active');
      }
    });

    /* Keyboard resize */
    resizeHandle.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      var rect = panelsEl.getBoundingClientRect();
      var ip = panelsEl.querySelector('.jf-panel-input');
      var curLeft = ip ? ip.getBoundingClientRect().width : rect.width / 2;
      var step = 20;
      var totalW = rect.width - 8;
      var newL = e.key === 'ArrowRight' ? curLeft + step : curLeft - step;
      if (newL < 200) newL = 200;
      if (newL > totalW - 200) newL = totalW - 200;
      var lp = (newL / totalW) * 100;
      panelsEl.style.gridTemplateColumns = lp + '% 8px ' + (100 - lp) + '%';
    });
  }


  /* ==========================================================================
     KEYBOARD SHORTCUTS
     ========================================================================== */

  function handleShortcuts(e) {
    var ctrl = e.ctrlKey || e.metaKey;

    /* Ctrl+Enter — Format */
    if (ctrl && e.key === 'Enter') {
      e.preventDefault();
      formatJSON();
      return;
    }

    /* Ctrl+Shift+M — Minify */
    if (ctrl && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
      e.preventDefault();
      minifyJSON();
      return;
    }

    /* Ctrl+Shift+V — Validate (when not in input) */
    if (ctrl && e.shiftKey && (e.key === 'V' || e.key === 'v') && document.activeElement !== input) {
      e.preventDefault();
      validateJSON();
      return;
    }

    /* Ctrl+Shift+C — Copy output */
    if (ctrl && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      copyToClipboard(output.value, 'Output');
      return;
    }

    /* Ctrl+Shift+X — Clear */
    if (ctrl && e.shiftKey && (e.key === 'X' || e.key === 'x')) {
      e.preventDefault();
      clearAll();
      return;
    }

    /* Ctrl+Z — Undo (only when our input is focused) */
    if (ctrl && !e.shiftKey && (e.key === 'z' || e.key === 'Z') && document.activeElement === input) {
      e.preventDefault();
      undo();
      return;
    }

    /* Ctrl+Y or Ctrl+Shift+Z — Redo */
    if (ctrl && ((e.key === 'y' || e.key === 'Y') || (e.shiftKey && (e.key === 'z' || e.key === 'Z'))) && document.activeElement === input) {
      e.preventDefault();
      redo();
      return;
    }
  }


  /* ==========================================================================
     DEBOUNCED INPUT HANDLER
     ========================================================================== */

  var debounceTimer = null;

  function onInputChange() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      updateLineNumbers(input, lineNumsInput);
      highlightSyntax(input, hlInput);
      lightValidate();
      pushHistory(input.value);
      saveToStorage();
    }, DEBOUNCE_MS);
  }


  /* ==========================================================================
     EVENT BINDINGS
     ========================================================================== */

  /* Action buttons */
  btnFormat.addEventListener('click', formatJSON);
  btnMinify.addEventListener('click', minifyJSON);
  btnValidate.addEventListener('click', validateJSON);
  btnFix.addEventListener('click', fixAndFormat);
  btnDiff.addEventListener('click', showDiff);
  btnClear.addEventListener('click', clearAll);
  btnWrapToggle.addEventListener('click', toggleWrap);
  btnErrorClose.addEventListener('click', hideError);
  btnTheme.addEventListener('click', toggleTheme);
  btnUndo.addEventListener('click', undo);
  btnRedo.addEventListener('click', redo);
  btnPerfDismiss.addEventListener('click', function () {
    perfWarning.classList.add('jf-perf-warning-hidden');
  });

  btnSample.addEventListener('click', function () {
    input.value = sampleJSON;
    pushHistory(sampleJSON);
    refreshInputUI();
    formatJSON();
  });

  /* Clipboard */
  btnCopy.addEventListener('click', function () { copyToClipboard(output.value, 'Output'); });
  btnCopyOutput.addEventListener('click', function () { copyToClipboard(output.value, 'Output'); });
  btnCopyPath.addEventListener('click', function () { copyToClipboard(treePathValue.textContent, 'Path'); });
  btnPaste.addEventListener('click', pasteFromClipboard);

  /* Status path click to copy */
  statusPath.addEventListener('click', function () {
    if (statusPath.textContent) copyToClipboard(statusPath.textContent, 'Path');
  });

  /* File I/O */
  btnDownload.addEventListener('click', downloadJSON);
  btnUpload.addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', handleFileUpload);

  /* Tabs */
  tabEditor.addEventListener('click', switchToEditor);
  tabTree.addEventListener('click', switchToTree);
  tabDiff.addEventListener('click', function () {
    if (output.value) showDiff();
    else showToast('Format JSON first', 'error');
  });
  btnDiffClose.addEventListener('click', switchToEditor);

  /* Tree controls */
  btnExpandAll.addEventListener('click', expandAllNodes);
  btnCollapseAll.addEventListener('click', collapseAllNodes);

  /* Tree search */
  var treeSearchTimer = null;
  treeSearch.addEventListener('input', function () {
    if (treeSearchTimer) clearTimeout(treeSearchTimer);
    treeSearchTimer = setTimeout(function () {
      searchTree(treeSearch.value.trim());
    }, 200);
  });

  /* Indent change */
  indentSelect.addEventListener('change', function () {
    if (state.lastParsed !== null) formatJSON();
  });

  /* Input textarea */
  input.addEventListener('input', onInputChange);

  /* Tab key */
  input.addEventListener('keydown', handleTabKey);

  /* Scroll sync */
  input.addEventListener('scroll', function () {
    syncLineScroll(input, lineNumsInput);
    syncHighlightScroll(input, hlInput);
  }, { passive: true });

  output.addEventListener('scroll', function () {
    syncLineScroll(output, lineNumsOutput);
    syncHighlightScroll(output, hlOutput);
  }, { passive: true });

  /* Global keyboard shortcuts */
  document.addEventListener('keydown', handleShortcuts);

  /* Drag and drop */
  input.addEventListener('dragover', function (e) {
    e.preventDefault();
    input.classList.add('jf-textarea-dragover');
  });

  input.addEventListener('dragleave', function () {
    input.classList.remove('jf-textarea-dragover');
  });

  input.addEventListener('drop', function (e) {
    e.preventDefault();
    input.classList.remove('jf-textarea-dragover');
    var files = e.dataTransfer.files;
    if (files.length > 0) {
      var file = files[0];
      if (file.size > MAX_FILE_SIZE) {
        showToast('File too large (max 5MB)', 'error');
        return;
      }
      var reader = new FileReader();
      reader.onload = function (ev) {
        input.value = ev.target.result;
        pushHistory(ev.target.result);
        refreshInputUI();
        formatJSON();
        showToast('Loaded: ' + file.name, 'success');
      };
      reader.readAsText(file);
    }
  });


  /* ==========================================================================
     INIT
     ========================================================================== */

  function init() {
    /* Initialize theme */
    initTheme();

    /* Load saved input */
    var hadSaved = loadFromStorage();

    /* Initialize UI */
    updateLineNumbers(input, lineNumsInput);
    updateLineNumbers(output, lineNumsOutput);
    highlightSyntax(input, hlInput);
    initResize();
    setStatus('idle', 'Paste or type JSON to get started');
    updateUndoRedoButtons();

    /* If we had saved content, do a light validate */
    if (hadSaved) {
      lightValidate();
      highlightSyntax(input, hlInput);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();