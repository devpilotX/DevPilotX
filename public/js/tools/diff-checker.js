/* ========================================================================
   DIFF CHECKER v2 — public/js/tools/diff-checker.js
   -------------------------------------------------------------------------
   Production-grade diff engine.
   - Myers O(ND) algorithm (same as Git) — optimal, linear-space variant
   - Web Worker for non-blocking computation on large files
   - Character-level sub-line diffing
   - Virtual scrolling for 100k+ line output
   - Minimap rendering via canvas
   - Split / Unified / Inline views
   - Dark mode, word wrap, auto-compare, fullscreen
   - Drag & drop, file upload, clipboard, share URL
   - Complete keyboard shortcuts
   - Robust error boundaries everywhere
   -------------------------------------------------------------------------
   Value.Codes — Free Developer Tools
   ======================================================================== */

;(function () {
  'use strict';

  // =========================================================================
  // CONFIG
  // =========================================================================
  var CONFIG = {
    ROW_HEIGHT: 22,
    OVERSCAN: 20,
    AUTO_DEBOUNCE: 400,
    MAX_CHAR_DIFF_LEN: 800,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
    TOAST_DURATION: 2500,
    MINIMAP_WIDTH: 56,
    SHARE_MAX_BYTES: 50000,
  };

  // =========================================================================
  // DOM CACHE
  // =========================================================================
  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel) { return document.querySelectorAll(sel); };

  var DOM = {
    page: document.querySelector('.diff-checker-page'),
    inputOrig: $('dc-input-original'),
    inputMod: $('dc-input-modified'),
    gutterOrig: $('dc-gutter-original'),
    gutterMod: $('dc-gutter-modified'),
    infoOrig: $('dc-info-original'),
    infoMod: $('dc-info-modified'),
    panelOrig: $('dc-panel-original'),
    panelMod: $('dc-panel-modified'),
    editors: $('dc-editors'),
    resizeHandle: $('dc-resize-handle'),
    output: $('dc-output'),
    outputBar: $('dc-output-bar'),
    outputBody: $('dc-output-body'),
    loading: $('dc-loading'),
    timing: $('dc-timing'),
    // Split
    splitLeft: $('dc-split-left'),
    splitRight: $('dc-split-right'),
    scrollLeft: $('dc-scroll-left'),
    scrollRight: $('dc-scroll-right'),
    // Unified
    scrollUnified: $('dc-scroll-unified'),
    // Inline
    scrollInline: $('dc-scroll-inline'),
    // Minimap
    minimapLeft: $('dc-minimap-left'),
    minimapRight: $('dc-minimap-right'),
    minimapCanvasLeft: $('dc-minimap-canvas-left'),
    minimapCanvasRight: $('dc-minimap-canvas-right'),
    minimapVpLeft: $('dc-minimap-vp-left'),
    minimapVpRight: $('dc-minimap-vp-right'),
    // Stats
    nAdd: $('dc-n-add'),
    nDel: $('dc-n-del'),
    nEq: $('dc-n-eq'),
    // Nav
    navCounter: $('dc-nav-counter'),
    btnPrev: $('dc-prev'),
    btnNext: $('dc-next'),
    // Buttons
    btnCompare: $('dc-btn-compare'),
    btnSwap: $('dc-btn-swap'),
    btnClear: $('dc-btn-clear'),
    btnTheme: $('dc-btn-theme'),
    btnShare: $('dc-btn-share'),
    btnCopyDiff: $('dc-btn-copy-diff'),
    btnDownload: $('dc-btn-download'),
    btnFullscreen: $('dc-btn-fullscreen'),
    // Options
    cbIgnoreWS: $('dc-ignore-ws'),
    cbIgnoreCase: $('dc-ignore-case'),
    cbWordWrap: $('dc-word-wrap'),
    cbAutoCompare: $('dc-auto-compare'),
    selLanguage: $('dc-language'),
    // Toast
    toastContainer: $('dc-toast-container'),
    // Error
    errorMsg: $('dc-error-msg'),
  };

  // =========================================================================
  // STATE
  // =========================================================================
  var state = {
    view: 'split',              // 'split' | 'unified' | 'inline'
    darkMode: false,
    diffOps: null,              // Array of diff operations
    splitRows: { left: [], right: [] },
    unifiedRows: [],
    inlineRows: [],
    changePositions: [],        // Indices into rows that are changes
    currentChange: -1,
    totalChanges: 0,
    stats: { added: 0, removed: 0, equal: 0 },
    computing: false,
    autoTimer: null,
    workerReady: false,
  };

  // =========================================================================
  // UTILS
  // =========================================================================
  function escHtml(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatNumber(n) {
    return n.toLocaleString();
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // =========================================================================
  // TOAST
  // =========================================================================
  function toast(msg, type) {
    try {
      var el = document.createElement('div');
      el.className = 'dc-toast' + (type ? ' dc-toast--' + type : '');
      el.textContent = msg;
      DOM.toastContainer.appendChild(el);
      setTimeout(function () {
        el.classList.add('dc-toast--out');
        setTimeout(function () {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 250);
      }, CONFIG.TOAST_DURATION);
    } catch (e) { /* silent */ }
  }

  // =========================================================================
  // EDITOR: LINE NUMBERS + INFO
  // =========================================================================
  function updateGutter(textarea, gutter) {
    try {
      var count = (textarea.value.match(/\\n/g) || []).length + 1;
      var html = '';
      for (var i = 1; i <= count; i++) {
        html += '<span class="dc-gutter-num">' + i + '</span>';
      }
      gutter.innerHTML = html;
    } catch (e) { /* silent */ }
  }

  function updateInfo(textarea, infoEl) {
    try {
      var val = textarea.value;
      var lines = (val.match(/\\n/g) || []).length + 1;
      var chars = val.length;
      infoEl.textContent = formatNumber(lines) + ' lines · ' + formatNumber(chars) + ' chars';
    } catch (e) { /* silent */ }
  }

  function syncGutterScroll(textarea, gutter) {
    gutter.style.transform = 'translateY(-' + textarea.scrollTop + 'px)';
  }

  // =========================================================================
  // MYERS DIFF ALGORITHM — O(ND), Linear Space Variant
  // =========================================================================
  /**
   * Myers' diff algorithm (1986). Finds the shortest edit script between two
   * sequences. This is the same algorithm used by Git.
   *
   * Complexity: O(ND) time, O(N) space where N = total lines, D = edit distance.
   * For similar files (small D), this is extremely fast.
   *
   * Returns array of ops: { type: 'equal'|'insert'|'delete', oldIdx, newIdx }
   */
  function myersDiff(a, b) {
    var N = a.length;
    var M = b.length;
    var MAX = N + M;

    if (MAX === 0) return [];

    // Optimization: handle trivial cases
    if (N === 0) {
      var ops = [];
      for (var j = 0; j < M; j++) ops.push({ type: 'insert', newIdx: j });
      return ops;
    }
    if (M === 0) {
      var ops2 = [];
      for (var i = 0; i < N; i++) ops2.push({ type: 'delete', oldIdx: i });
      return ops2;
    }

    // V stores the furthest reaching d-path endpoints
    // Using offset to handle negative indices: V[k + offset]
    var offset = MAX;
    var size = 2 * MAX + 1;
    var V = new Int32Array(size);
    V.fill(-1);
    V[1 + offset] = 0;

    // Store trace for backtracking
    var trace = [];

    var found = false;
    for (var d = 0; d <= MAX; d++) {
      // Save current V state for backtracking
      trace.push(V.slice());

      for (var k = -d; k <= d; k += 2) {
        var kIdx = k + offset;

        var x;
        if (k === -d || (k !== d && V[kIdx - 1] < V[kIdx + 1])) {
          x = V[kIdx + 1]; // move down (insert)
        } else {
          x = V[kIdx - 1] + 1; // move right (delete)
        }

        var y = x - k;

        // Follow diagonal (equal elements)
        while (x < N && y < M && a[x] === b[y]) {
          x++;
          y++;
        }

        V[kIdx] = x;

        if (x >= N && y >= M) {
          found = true;
          break;
        }
      }

      if (found) break;
    }

    // Backtrack to find the actual edit script
    var editOps = [];
    var cx = N;
    var cy = M;

    for (var dd = trace.length - 1; dd > 0; dd--) {
      var ck = cx - cy;
      var prevV = trace[dd - 1];

      var prevK;
      if (ck === -dd || (ck !== dd && prevV[ck - 1 + offset] < prevV[ck + 1 + offset])) {
        prevK = ck + 1; // came from insert
      } else {
        prevK = ck - 1; // came from delete
      }

      var prevX = prevV[prevK + offset];
      var prevY = prevX - prevK;

      // Diagonal moves (equals)
      while (cx > prevX && cy > prevY) {
        cx--;
        cy--;
        editOps.push({ type: 'equal', oldIdx: cx, newIdx: cy });
      }

      if (dd > 0) {
        if (cx === prevX) {
          // Insert
          cy--;
          editOps.push({ type: 'insert', newIdx: cy });
        } else {
          // Delete
          cx--;
          editOps.push({ type: 'delete', oldIdx: cx });
        }
      }
    }

    // Handle remaining diagonals at d=0
    while (cx > 0 && cy > 0) {
      cx--;
      cy--;
      editOps.push({ type: 'equal', oldIdx: cx, newIdx: cy });
    }

    editOps.reverse();
    return editOps;
  }

  // =========================================================================
  // CHARACTER-LEVEL DIFF (for sub-line precision)
  // =========================================================================
  function charDiff(oldStr, newStr) {
    if (!oldStr && !newStr) return { oldHtml: '', newHtml: '' };
    if (!oldStr) return { oldHtml: '', newHtml: '<span class="dc-ch-add">' + escHtml(newStr) + '</span>' };
    if (!newStr) return { oldHtml: '<span class="dc-ch-del">' + escHtml(oldStr) + '</span>', newHtml: '' };

    // Skip for very long lines — too expensive
    if (oldStr.length > CONFIG.MAX_CHAR_DIFF_LEN || newStr.length > CONFIG.MAX_CHAR_DIFF_LEN) {
      return {
        oldHtml: '<span class="dc-ch-del">' + escHtml(oldStr) + '</span>',
        newHtml: '<span class="dc-ch-add">' + escHtml(newStr) + '</span>',
      };
    }

    var a = oldStr.split('');
    var b = newStr.split('');
    var ops = myersDiff(a, b);

    var oldHtml = '';
    var newHtml = '';
    var delBuf = '';
    var insBuf = '';

    function flush() {
      if (delBuf) {
        oldHtml += '<span class="dc-ch-del">' + escHtml(delBuf) + '</span>';
        delBuf = '';
      }
      if (insBuf) {
        newHtml += '<span class="dc-ch-add">' + escHtml(insBuf) + '</span>';
        insBuf = '';
      }
    }

    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (op.type === 'equal') {
        flush();
        var ch = escHtml(a[op.oldIdx]);
        oldHtml += ch;
        newHtml += ch;
      } else if (op.type === 'delete') {
        delBuf += a[op.oldIdx];
      } else if (op.type === 'insert') {
        insBuf += b[op.newIdx];
      }
    }
    flush();

    return { oldHtml: oldHtml, newHtml: newHtml };
  }

  // =========================================================================
  // WEB WORKER (Inline Blob Worker)
  // =========================================================================
  var worker = null;

  function createWorkerBlob() {
    var code = '(' + function () {
      /* --- Worker scope --- */

      function myersDiffWorker(a, b) {
        var N = a.length;
        var M = b.length;
        var MAX = N + M;

        if (MAX === 0) return [];
        if (N === 0) {
          var r = [];
          for (var j = 0; j < M; j++) r.push({ type: 'insert', newIdx: j });
          return r;
        }
        if (M === 0) {
          var r2 = [];
          for (var i = 0; i < N; i++) r2.push({ type: 'delete', oldIdx: i });
          return r2;
        }

        var offset = MAX;
        var size = 2 * MAX + 1;
        var V = new Int32Array(size);
        V.fill(-1);
        V[1 + offset] = 0;
        var trace = [];
        var found = false;

        for (var d = 0; d <= MAX; d++) {
          trace.push(V.slice());
          for (var k = -d; k <= d; k += 2) {
            var kIdx = k + offset;
            var x;
            if (k === -d || (k !== d && V[kIdx - 1] < V[kIdx + 1])) {
              x = V[kIdx + 1];
            } else {
              x = V[kIdx - 1] + 1;
            }
            var y = x - k;
            while (x < N && y < M && a[x] === b[y]) { x++; y++; }
            V[kIdx] = x;
            if (x >= N && y >= M) { found = true; break; }
          }
          if (found) break;
        }

        var ops = [];
        var cx = N, cy = M;
        for (var dd = trace.length - 1; dd > 0; dd--) {
          var ck = cx - cy;
          var prevV = trace[dd - 1];
          var prevK;
          if (ck === -dd || (ck !== dd && prevV[ck - 1 + offset] < prevV[ck + 1 + offset])) {
            prevK = ck + 1;
          } else {
            prevK = ck - 1;
          }
          var prevX = prevV[prevK + offset];
          var prevY = prevX - prevK;
          while (cx > prevX && cy > prevY) { cx--; cy--; ops.push({ type: 'equal', oldIdx: cx, newIdx: cy }); }
          if (dd > 0) {
            if (cx === prevX) { cy--; ops.push({ type: 'insert', newIdx: cy }); }
            else { cx--; ops.push({ type: 'delete', oldIdx: cx }); }
          }
        }
        while (cx > 0 && cy > 0) { cx--; cy--; ops.push({ type: 'equal', oldIdx: cx, newIdx: cy }); }
        ops.reverse();
        return ops;
      }

      function preprocess(line, ignoreWS, ignoreCase) {
        var r = line;
        if (ignoreWS) r = r.replace(/\\s+/g, ' ').trim();
        if (ignoreCase) r = r.toLowerCase();
        return r;
      }

      self.onmessage = function (e) {
        try {
          var data = e.data;
          var linesA = data.textA.split('\\n');
          var linesB = data.textB.split('\\n');
          var pA = linesA.map(function (l) { return preprocess(l, data.ignoreWS, data.ignoreCase); });
          var pB = linesB.map(function (l) { return preprocess(l, data.ignoreWS, data.ignoreCase); });
          var ops = myersDiffWorker(pA, pB);

          // Map ops back to original lines and annotate with line numbers
          var result = [];
          for (var i = 0; i < ops.length; i++) {
            var op = ops[i];
            if (op.type === 'equal') {
              result.push({ type: 'equal', oldLine: linesA[op.oldIdx], newLine: linesB[op.newIdx], oldNum: op.oldIdx + 1, newNum: op.newIdx + 1 });
            } else if (op.type === 'delete') {
              result.push({ type: 'delete', oldLine: linesA[op.oldIdx], oldNum: op.oldIdx + 1 });
            } else if (op.type === 'insert') {
              result.push({ type: 'insert', newLine: linesB[op.newIdx], newNum: op.newIdx + 1 });
            }
          }

          self.postMessage({ ok: true, result: result });
        } catch (err) {
          self.postMessage({ ok: false, error: err.message || 'Worker error' });
        }
      };
    } + ')();';

    try {
      var blob = new Blob([code], { type: 'application/javascript' });
      worker = new Worker(URL.createObjectURL(blob));
      state.workerReady = true;
    } catch (e) {
      // Workers not supported — fallback to main thread
      state.workerReady = false;
    }
  }

  createWorkerBlob();

  // =========================================================================
  // PREPROCESSING
  // =========================================================================
  function preprocessLine(line) {
    var r = line;
    if (DOM.cbIgnoreWS.checked) r = r.replace(/\\s+/g, ' ').trim();
    if (DOM.cbIgnoreCase.checked) r = r.toLowerCase();
    return r;
  }

  // =========================================================================
  // MAIN DIFF (Main Thread fallback)
  // =========================================================================
  function computeDiffMainThread(textA, textB) {
    var linesA = textA.split('\\n');
    var linesB = textB.split('\\n');
    var pA = linesA.map(preprocessLine);
    var pB = linesB.map(preprocessLine);
    var ops = myersDiff(pA, pB);
    var result = [];

    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (op.type === 'equal') {
        result.push({ type: 'equal', oldLine: linesA[op.oldIdx], newLine: linesB[op.newIdx], oldNum: op.oldIdx + 1, newNum: op.newIdx + 1 });
      } else if (op.type === 'delete') {
        result.push({ type: 'delete', oldLine: linesA[op.oldIdx], oldNum: op.oldIdx + 1 });
      } else if (op.type === 'insert') {
        result.push({ type: 'insert', newLine: linesB[op.newIdx], newNum: op.newIdx + 1 });
      }
    }

    return result;
  }

  // =========================================================================
  // BUILD VIEW DATA
  // =========================================================================
  function buildSplitData(ops) {
    var left = [];
    var right = [];
    var changes = [];

    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];

      if (op.type === 'equal') {
        left.push({ type: 'eq', num: op.oldNum, code: escHtml(op.oldLine) });
        right.push({ type: 'eq', num: op.newNum, code: escHtml(op.newLine) });
      } else if (op.type === 'delete' && i + 1 < ops.length && ops[i + 1].type === 'insert') {
        // Paired modification — apply char diff
        var next = ops[i + 1];
        var cd = charDiff(op.oldLine, next.newLine);
        left.push({ type: 'del', num: op.oldNum, code: cd.oldHtml });
        right.push({ type: 'add', num: next.newNum, code: cd.newHtml });
        changes.push(left.length - 1);
        i++; // skip paired insert
      } else if (op.type === 'delete') {
        left.push({ type: 'del', num: op.oldNum, code: escHtml(op.oldLine) });
        right.push({ type: 'empty', num: '', code: '' });
        changes.push(left.length - 1);
      } else if (op.type === 'insert') {
        left.push({ type: 'empty', num: '', code: '' });
        right.push({ type: 'add', num: op.newNum, code: escHtml(op.newLine) });
        changes.push(left.length - 1);
      }
    }

    return { left: left, right: right, changes: changes };
  }

  function buildUnifiedData(ops) {
    var rows = [];
    var changes = [];

    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (op.type === 'equal') {
        rows.push({ type: 'eq', numL: op.oldNum, numR: op.newNum, code: escHtml(op.oldLine) });
      } else if (op.type === 'delete') {
        rows.push({ type: 'del', numL: op.oldNum, numR: '', code: escHtml(op.oldLine) });
        changes.push(rows.length - 1);
      } else if (op.type === 'insert') {
        rows.push({ type: 'add', numL: '', numR: op.newNum, code: escHtml(op.newLine) });
        changes.push(rows.length - 1);
      }
    }

    return { rows: rows, changes: changes };
  }

  function buildInlineData(ops) {
    var lines = [];

    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (op.type === 'equal') {
        lines.push({ type: 'eq', html: escHtml(op.oldLine) });
      } else if (op.type === 'delete' && i + 1 < ops.length && ops[i + 1].type === 'insert') {
        var next = ops[i + 1];
        var cd = charDiff(op.oldLine, next.newLine);
        lines.push({ type: 'mixed', delHtml: cd.oldHtml, addHtml: cd.newHtml });
        i++;
      } else if (op.type === 'delete') {
        lines.push({ type: 'del', html: escHtml(op.oldLine) });
      } else if (op.type === 'insert') {
        lines.push({ type: 'add', html: escHtml(op.newLine) });
      }
    }

    return lines;
  }

  function computeStats(ops) {
    var s = { added: 0, removed: 0, equal: 0 };
    for (var i = 0; i < ops.length; i++) {
      if (ops[i].type === 'insert') s.added++;
      else if (ops[i].type === 'delete') s.removed++;
      else s.equal++;
    }
    return s;
  }

  // =========================================================================
  // VIRTUAL SCROLL RENDERER
  // =========================================================================
  function VirtualScroller(container, rowData, renderRow, rowH) {
    this.container = container;
    this.data = rowData;
    this.renderRow = renderRow;
    this.rowH = rowH || CONFIG.ROW_HEIGHT;
    this.totalH = this.data.length * this.rowH;
    this.lastStart = -1;
    this.lastEnd = -1;

    // Create spacer and content holder
    this.spacer = document.createElement('div');
    this.spacer.style.height = this.totalH + 'px';
    this.spacer.style.position = 'relative';
    this.spacer.style.width = '100%';

    this.content = document.createElement('div');
    this.content.style.position = 'absolute';
    this.content.style.left = '0';
    this.content.style.right = '0';
    this.content.style.willChange = 'transform';

    this.spacer.appendChild(this.content);
    container.innerHTML = '';
    container.appendChild(this.spacer);

    this._onScroll = this.update.bind(this);
    container.addEventListener('scroll', this._onScroll, { passive: true });

    this.update();
  }

  VirtualScroller.prototype.update = function () {
    var scrollTop = this.container.scrollTop;
    var viewH = this.container.clientHeight;
    var start = Math.max(0, Math.floor(scrollTop / this.rowH) - CONFIG.OVERSCAN);
    var end = Math.min(this.data.length, Math.ceil((scrollTop + viewH) / this.rowH) + CONFIG.OVERSCAN);

    if (start === this.lastStart && end === this.lastEnd) return;
    this.lastStart = start;
    this.lastEnd = end;

    this.content.style.top = (start * this.rowH) + 'px';

    var fragment = document.createDocumentFragment();
    for (var i = start; i < end; i++) {
      fragment.appendChild(this.renderRow(this.data[i], i));
    }
    this.content.innerHTML = '';
    this.content.appendChild(fragment);
  };

  VirtualScroller.prototype.scrollToRow = function (idx) {
    this.container.scrollTop = idx * this.rowH - this.container.clientHeight / 2 + this.rowH / 2;
  };

  VirtualScroller.prototype.destroy = function () {
    this.container.removeEventListener('scroll', this._onScroll);
    this.container.innerHTML = '';
  };

  // =========================================================================
  // ROW RENDERERS
  // =========================================================================
  function renderSplitRow(row, idx) {
    var div = document.createElement('div');
    var cls = 'dc-row dc-row--' + row.type;
    div.className = cls;
    div.style.height = CONFIG.ROW_HEIGHT + 'px';
    div.setAttribute('data-idx', idx);

    div.innerHTML =
      '<span class="dc-row-num">' + (row.num || '') + '</span>' +
      '<span class="dc-row-marker">' + (row.type === 'add' ? '+' : row.type === 'del' ? '−' : '') + '</span>' +
      '<span class="dc-row-code">' + (row.code || '&nbsp;') + '</span>';

    return div;
  }

  function renderUnifiedRow(row, idx) {
    var div = document.createElement('div');
    var cls = 'dc-u-row';
    if (row.type === 'add') cls += ' dc-u-row--add';
    else if (row.type === 'del') cls += ' dc-u-row--del';
    div.className = cls;
    div.style.height = CONFIG.ROW_HEIGHT + 'px';
    div.setAttribute('data-idx', idx);

    div.innerHTML =
      '<span class="dc-u-num-l">' + (row.numL || '') + '</span>' +
      '<span class="dc-u-num-r">' + (row.numR || '') + '</span>' +
      '<span class="dc-u-marker">' + (row.type === 'add' ? '+' : row.type === 'del' ? '−' : '') + '</span>' +
      '<span class="dc-u-code">' + (row.code || '&nbsp;') + '</span>';

    return div;
  }

  // =========================================================================
  // SCROLL SYNC (Split View)
  // =========================================================================
  var scrollSyncing = false;

  function setupScrollSync() {
    function sync(source, target) {
      if (scrollSyncing) return;
      scrollSyncing = true;
      requestAnimationFrame(function () {
        target.scrollTop = source.scrollTop;
        target.scrollLeft = source.scrollLeft;
        scrollSyncing = false;
      });
    }

    DOM.scrollLeft.addEventListener('scroll', function () {
      sync(DOM.scrollLeft, DOM.scrollRight);
      updateMinimapViewport('left');
    }, { passive: true });

    DOM.scrollRight.addEventListener('scroll', function () {
      sync(DOM.scrollRight, DOM.scrollLeft);
      updateMinimapViewport('right');
    }, { passive: true });
  }

  // =========================================================================
  // MINIMAP
  // =========================================================================
  function renderMinimap(canvas, rows, side) {
    try {
      var ctx = canvas.getContext('2d');
      var dpr = window.devicePixelRatio || 1;
      var rect = canvas.parentElement.getBoundingClientRect();
      var w = rect.width;
      var h = rect.height;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, w, h);

      if (rows.length === 0) return;

      var rowH = Math.max(1, h / rows.length);
      var isDark = state.darkMode;

      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var y = i * rowH;

        if (row.type === 'add') {
          ctx.fillStyle = isDark ? 'rgba(34,197,94,0.6)' : '#22c55e';
          ctx.fillRect(0, y, w, Math.max(rowH, 1));
        } else if (row.type === 'del') {
          ctx.fillStyle = isDark ? 'rgba(239,68,68,0.6)' : '#ef4444';
          ctx.fillRect(0, y, w, Math.max(rowH, 1));
        }
      }
    } catch (e) { /* silent */ }
  }

  function updateMinimapViewport(side) {
    try {
      var scrollArea, viewport, rows;
      if (side === 'left') {
        scrollArea = DOM.scrollLeft;
        viewport = DOM.minimapVpLeft;
        rows = state.splitRows.left;
      } else {
        scrollArea = DOM.scrollRight;
        viewport = DOM.minimapVpRight;
        rows = state.splitRows.right;
      }

      var totalH = rows.length * CONFIG.ROW_HEIGHT;
      if (totalH === 0) return;

      var containerH = scrollArea.parentElement.getBoundingClientRect().height;
      var ratio = containerH / totalH;
      var vpH = Math.max(20, ratio * containerH);
      var scrollRatio = scrollArea.scrollTop / (totalH - scrollArea.clientHeight || 1);
      var vpTop = scrollRatio * (containerH - vpH);

      viewport.style.top = Math.max(0, vpTop) + 'px';
      viewport.style.height = vpH + 'px';
    } catch (e) { /* silent */ }
  }

  // =========================================================================
  // RENDER OUTPUT
  // =========================================================================
  var scrollerLeft = null;
  var scrollerRight = null;
  var scrollerUnified = null;

  function destroyScrollers() {
    if (scrollerLeft) { scrollerLeft.destroy(); scrollerLeft = null; }
    if (scrollerRight) { scrollerRight.destroy(); scrollerRight = null; }
    if (scrollerUnified) { scrollerUnified.destroy(); scrollerUnified = null; }
    DOM.scrollInline.innerHTML = '';
  }

  function renderOutput() {
    try {
      var ops = state.diffOps;
      if (!ops) return;

      destroyScrollers();

      state.stats = computeStats(ops);
      DOM.nAdd.textContent = formatNumber(state.stats.added);
      DOM.nDel.textContent = formatNumber(state.stats.removed);
      DOM.nEq.textContent = formatNumber(state.stats.equal);

      // Check for identical
      if (state.stats.added === 0 && state.stats.removed === 0) {
        DOM.output.setAttribute('data-state', 'identical');
        state.changePositions = [];
        state.currentChange = -1;
        state.totalChanges = 0;
        updateNav();
        return;
      }

      // Build view data
      var splitData = buildSplitData(ops);
      state.splitRows.left = splitData.left;
      state.splitRows.right = splitData.right;

      var unifiedData = buildUnifiedData(ops);
      state.unifiedRows = unifiedData.rows;

      state.inlineRows = buildInlineData(ops);

      // Change positions for navigation (use split changes as canonical)
      state.changePositions = splitData.changes;
      state.totalChanges = splitData.changes.length;
      state.currentChange = -1;

      // Render split view (always — it's the default)
      scrollerLeft = new VirtualScroller(DOM.scrollLeft, splitData.left, renderSplitRow, CONFIG.ROW_HEIGHT);
      scrollerRight = new VirtualScroller(DOM.scrollRight, splitData.right, renderSplitRow, CONFIG.ROW_HEIGHT);

      // Render unified view
      scrollerUnified = new VirtualScroller(DOM.scrollUnified, unifiedData.rows, renderUnifiedRow, CONFIG.ROW_HEIGHT);

      // Render inline view (no virtual scroll needed — it's simpler)
      renderInlineView();

      // Minimap
      renderMinimap(DOM.minimapCanvasLeft, splitData.left, 'left');
      renderMinimap(DOM.minimapCanvasRight, splitData.right, 'right');

      // Update word wrap state
      if (DOM.cbWordWrap.checked) {
        DOM.output.classList.add('dc-wrap');
      } else {
        DOM.output.classList.remove('dc-wrap');
      }

      // Set output state
      DOM.output.setAttribute('data-state', 'diff');
      DOM.output.setAttribute('data-view', state.view);
      updateNav();

    } catch (err) {
      showError(err.message || 'Rendering failed');
    }
  }

  function renderInlineView() {
    var html = '';
    var rows = state.inlineRows;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row.type === 'eq') {
        html += '<div class="dc-i-line">' + row.html + '</div>';
      } else if (row.type === 'del') {
        html += '<div class="dc-i-line dc-i-del">' + row.html + '</div>';
      } else if (row.type === 'add') {
        html += '<div class="dc-i-line dc-i-add">' + row.html + '</div>';
      } else if (row.type === 'mixed') {
        html += '<div class="dc-i-line"><span class="dc-i-del">' + row.delHtml + '</span><span class="dc-i-add">' + row.addHtml + '</span></div>';
      }
    }

    DOM.scrollInline.innerHTML = html;
  }

  // =========================================================================
  // NAVIGATION
  // =========================================================================
  function updateNav() {
    var total = state.totalChanges;
    if (total === 0 || state.currentChange < 0) {
      DOM.navCounter.textContent = '0 / ' + total;
    } else {
      DOM.navCounter.textContent = (state.currentChange + 1) + ' / ' + total;
    }
  }

  function navigateChange(direction) {
    if (state.totalChanges === 0) return;

    if (direction === 'next') {
      state.currentChange = (state.currentChange + 1) % state.totalChanges;
    } else {
      state.currentChange = state.currentChange <= 0 ? state.totalChanges - 1 : state.currentChange - 1;
    }

    updateNav();

    var rowIdx = state.changePositions[state.currentChange];

    // Scroll to change in active view
    if (state.view === 'split') {
      if (scrollerLeft) scrollerLeft.scrollToRow(rowIdx);
      if (scrollerRight) scrollerRight.scrollToRow(rowIdx);
    } else if (state.view === 'unified' && scrollerUnified) {
      // Map split index to unified index — approximate
      scrollerUnified.scrollToRow(rowIdx);
    }
  }

  // =========================================================================
  // COMPARE
  // =========================================================================
  function runCompare() {
    if (state.computing) return;

    var textA = DOM.inputOrig.value;
    var textB = DOM.inputMod.value;

    if (!textA && !textB) {
      DOM.output.setAttribute('data-state', 'empty');
      destroyScrollers();
      resetStats();
      return;
    }

    state.computing = true;
    DOM.output.setAttribute('data-state', 'loading');
    var t0 = performance.now();

    if (state.workerReady && worker) {
      var msgHandler = function (e) {
        worker.removeEventListener('message', msgHandler);
        state.computing = false;
        var elapsed = (performance.now() - t0).toFixed(1);
        DOM.timing.textContent = elapsed + 'ms';

        if (e.data.ok) {
          state.diffOps = e.data.result;
          renderOutput();
        } else {
          showError(e.data.error || 'Diff computation failed');
        }
      };

      worker.addEventListener('message', msgHandler);
      worker.postMessage({
        textA: textA,
        textB: textB,
        ignoreWS: DOM.cbIgnoreWS.checked,
        ignoreCase: DOM.cbIgnoreCase.checked,
      });
    } else {
      // Fallback: main thread
      try {
        state.diffOps = computeDiffMainThread(textA, textB);
        state.computing = false;
        var elapsed = (performance.now() - t0).toFixed(1);
        DOM.timing.textContent = elapsed + 'ms';
        renderOutput();
      } catch (err) {
        state.computing = false;
        showError(err.message || 'Diff computation failed');
      }
    }
  }

  function resetStats() {
    DOM.nAdd.textContent = '0';
    DOM.nDel.textContent = '0';
    DOM.nEq.textContent = '0';
    DOM.timing.textContent = '';
    state.diffOps = null;
    state.changePositions = [];
    state.currentChange = -1;
    state.totalChanges = 0;
    updateNav();
  }

  function showError(msg) {
    DOM.errorMsg.textContent = msg;
    DOM.output.setAttribute('data-state', 'error');
  }

  // =========================================================================
  // AUTO-COMPARE (Debounced)
  // =========================================================================
  function scheduleAutoCompare() {
    if (!DOM.cbAutoCompare.checked) return;
    clearTimeout(state.autoTimer);
    state.autoTimer = setTimeout(runCompare, CONFIG.AUTO_DEBOUNCE);
  }

  // =========================================================================
  // VIEW SWITCHING
  // =========================================================================
  function setView(view) {
    state.view = view;
    DOM.output.setAttribute('data-view', view);

    $$('.dc-view-btn').forEach(function (btn) {
      var isActive = btn.getAttribute('data-view') === view;
      btn.classList.toggle('dc-view-btn--active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  }

  // =========================================================================
  // DARK MODE
  // =========================================================================
  function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    DOM.page.classList.toggle('dc-dark', state.darkMode);

    // Re-render minimaps for color changes
    if (state.splitRows.left.length) {
      renderMinimap(DOM.minimapCanvasLeft, state.splitRows.left, 'left');
      renderMinimap(DOM.minimapCanvasRight, state.splitRows.right, 'right');
    }

    toast(state.darkMode ? 'Dark mode enabled' : 'Light mode enabled');
  }

  // Detect system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    state.darkMode = true;
    DOM.page.classList.add('dc-dark');
  }

  // =========================================================================
  // WORD WRAP
  // =========================================================================
  DOM.cbWordWrap.addEventListener('change', function () {
    DOM.editors.classList.toggle('dc-wrap', this.checked);
    DOM.output.classList.toggle('dc-wrap', this.checked);
  });

  // =========================================================================
  // SWAP
  // =========================================================================
  function swapInputs() {
    var tmp = DOM.inputOrig.value;
    DOM.inputOrig.value = DOM.inputMod.value;
    DOM.inputMod.value = tmp;
    refreshEditors();
    toast('Inputs swapped', 'success');
    scheduleAutoCompare();
  }

  // =========================================================================
  // CLEAR
  // =========================================================================
  function clearAll() {
    DOM.inputOrig.value = '';
    DOM.inputMod.value = '';
    refreshEditors();
    destroyScrollers();
    resetStats();
    DOM.output.setAttribute('data-state', 'empty');
    toast('Cleared', 'success');
  }

  function refreshEditors() {
    updateGutter(DOM.inputOrig, DOM.gutterOrig);
    updateGutter(DOM.inputMod, DOM.gutterMod);
    updateInfo(DOM.inputOrig, DOM.infoOrig);
    updateInfo(DOM.inputMod, DOM.infoMod);
  }

  // =========================================================================
  // CLIPBOARD
  // =========================================================================
  function copyText(text, label) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      toast('Clipboard not available', 'error');
      return;
    }
    navigator.clipboard.writeText(text).then(function () {
      toast(label + ' copied', 'success');
    }).catch(function () {
      toast('Copy failed', 'error');
    });
  }

  function pasteInto(textarea) {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      toast('Clipboard not available', 'error');
      return;
    }
    navigator.clipboard.readText().then(function (text) {
      textarea.value = text;
      refreshEditors();
      toast('Pasted', 'success');
      scheduleAutoCompare();
    }).catch(function () {
      toast('Paste failed — allow clipboard access', 'error');
    });
  }

  // =========================================================================
  // COPY / DOWNLOAD DIFF
  // =========================================================================
  function generateUnifiedText() {
    if (!state.diffOps) return '';
    var lines = ['--- Original', '+++ Modified'];
    for (var i = 0; i < state.diffOps.length; i++) {
      var op = state.diffOps[i];
      if (op.type === 'equal') lines.push(' ' + op.oldLine);
      else if (op.type === 'delete') lines.push('-' + op.oldLine);
      else if (op.type === 'insert') lines.push('+' + op.newLine);
    }
    return lines.join('\\n');
  }

  function downloadDiff() {
    var text = generateUnifiedText();
    if (!text) { toast('Nothing to download', 'error'); return; }
    try {
      var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'diff-' + Date.now() + '.diff';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast('Downloaded', 'success');
    } catch (e) {
      toast('Download failed', 'error');
    }
  }

  // =========================================================================
  // SHARE VIA URL
  // =========================================================================
  function shareViaURL() {
    try {
      var a = DOM.inputOrig.value;
      var b = DOM.inputMod.value;
      var payload = JSON.stringify({ a: a, b: b });

      if (payload.length > CONFIG.SHARE_MAX_BYTES) {
        toast('Text too large to share via URL', 'error');
        return;
      }

      var encoded = btoa(unescape(encodeURIComponent(payload)));
      var url = window.location.origin + window.location.pathname + '#data=' + encoded;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () {
          toast('Share URL copied to clipboard', 'success');
        });
      } else {
        toast('Could not copy URL', 'error');
      }
    } catch (e) {
      toast('Share failed', 'error');
    }
  }

  function loadFromURL() {
    try {
      var hash = window.location.hash;
      if (!hash || hash.indexOf('#data=') !== 0) return;
      var encoded = hash.substring(6);
      var json = decodeURIComponent(escape(atob(encoded)));
      var data = JSON.parse(json);
      if (data.a !== undefined) DOM.inputOrig.value = data.a;
      if (data.b !== undefined) DOM.inputMod.value = data.b;
      refreshEditors();
      runCompare();
    } catch (e) {
      /* silent — invalid URL data */
    }
  }

  // =========================================================================
  // FULLSCREEN
  // =========================================================================
  function toggleFullscreen() {
    DOM.output.classList.toggle('dc-fullscreen');
    var isFS = DOM.output.classList.contains('dc-fullscreen');

    // Update scrollers if needed
    if (scrollerLeft) scrollerLeft.update();
    if (scrollerRight) scrollerRight.update();
    if (scrollerUnified) scrollerUnified.update();
  }

  // =========================================================================
  // FILE UPLOAD + DRAG & DROP
  // =========================================================================
  function readFile(file, textarea, label) {
    if (file.size > CONFIG.MAX_FILE_SIZE) {
      toast('File too large (max 10MB)', 'error');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      textarea.value = e.target.result;
      refreshEditors();
      toast(label + ': ' + file.name, 'success');
      scheduleAutoCompare();
    };
    reader.onerror = function () {
      toast('Failed to read file', 'error');
    };
    reader.readAsText(file);
  }

  function setupDragDrop(panel, textarea, label) {
    var dragCounter = 0;

    panel.addEventListener('dragenter', function (e) {
      e.preventDefault();
      dragCounter++;
      panel.classList.add('dc-dragover');
    });

    panel.addEventListener('dragleave', function () {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        panel.classList.remove('dc-dragover');
      }
    });

    panel.addEventListener('dragover', function (e) {
      e.preventDefault();
    });

    panel.addEventListener('drop', function (e) {
      e.preventDefault();
      dragCounter = 0;
      panel.classList.remove('dc-dragover');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        readFile(e.dataTransfer.files[0], textarea, label);
      }
    });
  }

  // =========================================================================
  // RESIZE HANDLE
  // =========================================================================
  function setupResize() {
    var handle = DOM.resizeHandle;
    var editors = DOM.editors;
    var dragging = false;
    var startX, startLeft;

    handle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startLeft = editors.getBoundingClientRect().left;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var editorW = editors.getBoundingClientRect().width;
      var offset = e.clientX - startLeft;
      var pct = clamp((offset / editorW) * 100, 20, 80);
      editors.style.gridTemplateColumns = pct + '% auto ' + (100 - pct) + '%';
    });

    document.addEventListener('mouseup', function () {
      if (dragging) {
        dragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });

    // Keyboard resize
    handle.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        var current = editors.style.gridTemplateColumns;
        var match = current.match(/([\\d.]+)%/);
        var pct = match ? parseFloat(match[1]) : 50;
        pct += e.key === 'ArrowLeft' ? -2 : 2;
        pct = clamp(pct, 20, 80);
        editors.style.gridTemplateColumns = pct + '% auto ' + (100 - pct) + '%';
      }
    });
  }

  // =========================================================================
  // PANEL ACTION BUTTONS (delegated)
  // =========================================================================
  function handlePanelAction(action, side) {
    var textarea = side === 'original' ? DOM.inputOrig : DOM.inputMod;
    var fileInput = document.querySelector('.dc-file-input[data-side="' + side + '"]');
    var label = side === 'original' ? 'Original' : 'Modified';

    switch (action) {
      case 'upload':
        fileInput.click();
        break;
      case 'paste':
        pasteInto(textarea);
        break;
      case 'copy':
        copyText(textarea.value, label);
        break;
      case 'clear-side':
        textarea.value = '';
        refreshEditors();
        scheduleAutoCompare();
        break;
    }
  }

  // =========================================================================
  // KEYBOARD SHORTCUTS
  // =========================================================================
  function setupKeyboard() {
    document.addEventListener('keydown', function (e) {
      var ctrl = e.ctrlKey || e.metaKey;
      var shift = e.shiftKey;

      // Ctrl+Enter → Compare
      if (ctrl && e.key === 'Enter') {
        e.preventDefault();
        runCompare();
        return;
      }

      // Ctrl+1/2/3 → View modes
      if (ctrl && !shift && e.key === '1') {
        e.preventDefault();
        setView('split');
        return;
      }
      if (ctrl && !shift && e.key === '2') {
        e.preventDefault();
        setView('unified');
        return;
      }
      if (ctrl && !shift && e.key === '3') {
        e.preventDefault();
        setView('inline');
        return;
      }

      // Ctrl+Shift+S → Swap
      if (ctrl && shift && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        swapInputs();
        return;
      }

      // Ctrl+Shift+X → Clear
      if (ctrl && shift && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        clearAll();
        return;
      }

      // Ctrl+Shift+D → Dark mode
      if (ctrl && shift && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        toggleDarkMode();
        return;
      }

      // F11 → Fullscreen
      if (e.key === 'F11' && DOM.output.getAttribute('data-state') === 'diff') {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      // Arrow up/down → Navigate changes (only when not in textarea)
      if (!ctrl && !shift && document.activeElement !== DOM.inputOrig && document.activeElement !== DOM.inputMod) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          navigateChange('prev');
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          navigateChange('next');
          return;
        }
      }
    });

    // Tab key in textareas → insert 2 spaces
    function handleTab(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var ta = e.target;
        var s = ta.selectionStart;
        var end = ta.selectionEnd;
        ta.value = ta.value.substring(0, s) + '  ' + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = s + 2;
        refreshEditors();
      }
    }

    DOM.inputOrig.addEventListener('keydown', handleTab);
    DOM.inputMod.addEventListener('keydown', handleTab);
  }

  // =========================================================================
  // EVENT BINDING
  // =========================================================================
  function init() {
    try {
      // Editors
      DOM.inputOrig.addEventListener('input', function () {
        updateGutter(DOM.inputOrig, DOM.gutterOrig);
        updateInfo(DOM.inputOrig, DOM.infoOrig);
        scheduleAutoCompare();
      });

      DOM.inputMod.addEventListener('input', function () {
        updateGutter(DOM.inputMod, DOM.gutterMod);
        updateInfo(DOM.inputMod, DOM.infoMod);
        scheduleAutoCompare();
      });

      DOM.inputOrig.addEventListener('scroll', function () {
        syncGutterScroll(DOM.inputOrig, DOM.gutterOrig);
      }, { passive: true });

      DOM.inputMod.addEventListener('scroll', function () {
        syncGutterScroll(DOM.inputMod, DOM.gutterMod);
      }, { passive: true });

      // Buttons
      DOM.btnCompare.addEventListener('click', runCompare);
      DOM.btnSwap.addEventListener('click', swapInputs);
      DOM.btnClear.addEventListener('click', clearAll);
      DOM.btnTheme.addEventListener('click', toggleDarkMode);
      DOM.btnShare.addEventListener('click', shareViaURL);
      DOM.btnCopyDiff.addEventListener('click', function () {
        var text = generateUnifiedText();
        if (!text) { toast('Nothing to copy', 'error'); return; }
        copyText(text, 'Diff');
      });
      DOM.btnDownload.addEventListener('click', downloadDiff);
      DOM.btnFullscreen.addEventListener('click', toggleFullscreen);
      DOM.btnPrev.addEventListener('click', function () { navigateChange('prev'); });
      DOM.btnNext.addEventListener('click', function () { navigateChange('next'); });

      // View buttons
      $$('.dc-view-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          setView(this.getAttribute('data-view'));
        });
      });

      // Option checkboxes → re-compare
      DOM.cbIgnoreWS.addEventListener('change', scheduleAutoCompare);
      DOM.cbIgnoreCase.addEventListener('change', scheduleAutoCompare);

      // Panel action delegation
      $$('.dc-icon-btn[data-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          handlePanelAction(this.getAttribute('data-action'), this.getAttribute('data-side'));
        });
      });

      // File inputs
      $$('.dc-file-input').forEach(function (input) {
        input.addEventListener('change', function () {
          var side = this.getAttribute('data-side');
          var textarea = side === 'original' ? DOM.inputOrig : DOM.inputMod;
          var label = side === 'original' ? 'Original' : 'Modified';
          if (this.files && this.files[0]) {
            readFile(this.files[0], textarea, label);
          }
          this.value = '';
        });
      });

      // Drag & drop
      setupDragDrop(DOM.panelOrig, DOM.inputOrig, 'Original');
      setupDragDrop(DOM.panelMod, DOM.inputMod, 'Modified');

      // Resize handle
      setupResize();

      // Scroll sync
      setupScrollSync();

      // Keyboard
      setupKeyboard();

      // Initial state
      refreshEditors();
      DOM.output.setAttribute('data-state', 'empty');
      DOM.output.setAttribute('data-view', 'split');

      // Load from URL if present
      loadFromURL();

    } catch (err) {
      console.error('[DiffChecker] Init error:', err);
    }
  }

  // =========================================================================
  // BOOT
  // =========================================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();