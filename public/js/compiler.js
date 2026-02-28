/* ================================================================
   public/js/compiler.js
   Value.Codes — Online Compiler  (Fully Client-Side v5)

   Execution strategy — zero backend calls:
   - JavaScript  → Blob Web Worker (10 s timeout) + new Function() fallback
   - Python      → Pyodide WASM  (cdn.jsdelivr.net, lazy-cached)
   - C / C++     → JSCPP         (cdn.jsdelivr.net, lazy-cached)
   - SQL         → SQL.js WASM   (cdnjs.cloudflare.com, lazy-cached)
   - 14 others   → regex transpiler → JavaScript Worker

   Features:
   [1] CodeMirror 5 — syntax highlighting, folding, bracket match
   [2] Dark / Light theme — localStorage persistence
   [3] Per-language auto-save / restore from localStorage
   [4] STDIN support (toggle panel)
   [5] Copy code / Copy output / Clear / Reset / Download
   [6] Ctrl+Enter / Cmd+Enter to run
   [7] Loading indicator for first-run WASM engines
   [8] Chunked output rendering for large output

   All wrapped in IIFE. Strict mode. Zero console.log in prod.
   ================================================================ */
(function () {
  'use strict';

  /* ================================================================
     CDN ENDPOINTS
     ================================================================ */
  var PYODIDE_INDEX = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';
  var PYODIDE_URL   = PYODIDE_INDEX + 'pyodide.js';
  var JSCPP_URL     = 'https://cdn.jsdelivr.net/npm/JSCPP@2.0.2/dist/JSCPP.es5.min.js';
  var SQLJS_URL     = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.js';
  var SQLJS_WASM    = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/sql-wasm.wasm';

  /* ================================================================
     CONSTANTS
     ================================================================ */
  var MAX_OUT      = 100000;
  var CHUNK        = 8000;
  var STORE        = 'vc_comp_';
  var SAVE_MS      = 500;
  var JS_TIMEOUT   = 10000;   /* Web Worker JS timeout ms */

  /* ================================================================
     ENGINE CACHE — load each runtime once, then reuse
     ================================================================ */
  var _py        = null;  var _pyQ  = [];  var _pyBusy  = false;
  var _cpp       = null;  var _cppQ = [];  var _cppBusy = false;
  var _sql       = null;  var _sqlQ = [];  var _sqlBusy = false;

  /* ================================================================
     LANGUAGE MAP
     ================================================================ */
  var LANG = {
    python:     { version: '3.10.0',  mode: 'python',                             ext: 'py',    file: 'main.py',
                  defaultCode: 'print("Hello, World!")' },
    javascript: { version: '18.15.0', mode: 'javascript',                          ext: 'js',    file: 'main.js',
                  defaultCode: 'console.log("Hello, World!");' },
    typescript: { version: '5.0.3',   mode: { name: 'javascript', typescript: true }, ext: 'ts', file: 'main.ts',
                  defaultCode: 'const msg: string = "Hello, World!";\nconsole.log(msg);' },
    'c++':      { version: '10.2.0',  mode: 'text/x-c++src',                      ext: 'cpp',   file: 'main.cpp',
                  defaultCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, World!" << endl;\n  return 0;\n}' },
    c:          { version: '10.2.0',  mode: 'text/x-csrc',                        ext: 'c',     file: 'main.c',
                  defaultCode: '#include <stdio.h>\n\nint main() {\n  printf("Hello, World!\\n");\n  return 0;\n}' },
    java:       { version: '15.0.2',  mode: 'text/x-java',                        ext: 'java',  file: 'Main.java',
                  defaultCode: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, World!");\n  }\n}' },
    csharp:     { version: '6.12.0',  mode: 'text/x-csharp',                      ext: 'cs',    file: 'main.cs',
                  defaultCode: 'using System;\n\nclass Program {\n  static void Main() {\n    Console.WriteLine("Hello, World!");\n  }\n}' },
    go:         { version: '1.16.2',  mode: 'go',                                 ext: 'go',    file: 'main.go',
                  defaultCode: 'package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Hello, World!")\n}' },
    rust:       { version: '1.68.2',  mode: 'rust',                               ext: 'rs',    file: 'main.rs',
                  defaultCode: 'fn main() {\n  println!("Hello, World!");\n}' },
    ruby:       { version: '3.0.1',   mode: 'ruby',                               ext: 'rb',    file: 'main.rb',
                  defaultCode: 'puts "Hello, World!"' },
    php:        { version: '8.2.3',   mode: 'php',                                ext: 'php',   file: 'main.php',
                  defaultCode: '<?php\necho "Hello, World!\\n";' },
    swift:      { version: '5.3.3',   mode: 'swift',                              ext: 'swift', file: 'main.swift',
                  defaultCode: 'print("Hello, World!")' },
    kotlin:     { version: '1.8.20',  mode: 'text/x-kotlin',                      ext: 'kt',    file: 'main.kt',
                  defaultCode: 'fun main() {\n  println("Hello, World!")\n}' },
    scala:      { version: '3.2.2',   mode: 'text/x-scala',                       ext: 'scala', file: 'Main.scala',
                  defaultCode: 'object Main extends App {\n  println("Hello, World!")\n}' },
    r:          { version: '4.1.1',   mode: 'r',                                  ext: 'r',     file: 'main.r',
                  defaultCode: 'cat("Hello, World!\\n")' },
    perl:       { version: '5.36.0',  mode: 'perl',                               ext: 'pl',    file: 'main.pl',
                  defaultCode: 'print "Hello, World!\\n";' },
    lua:        { version: '5.4.4',   mode: 'lua',                                ext: 'lua',   file: 'main.lua',
                  defaultCode: 'print("Hello, World!")' },
    bash:       { version: '5.2.0',   mode: 'shell',                              ext: 'sh',    file: 'main.sh',
                  defaultCode: 'echo "Hello, World!"' },
    sql:        { version: '3.36.0',  mode: 'sql',                                ext: 'sql',   file: 'main.sql',
                  defaultCode: 'SELECT "Hello, World!" AS greeting;' }
  };

  /* ================================================================
     DOM REFERENCES
     ================================================================ */
  function $(id) { return document.getElementById(id); }
  var langSelect     = $('lang-select');
  var langVersion    = $('lang-version');
  var runBtn         = $('run-btn');
  var outputArea     = $('output-area');
  var stdinToggle    = $('stdin-toggle');
  var stdinPanel     = $('stdin-panel');
  var stdinInput     = $('stdin-input');
  var copyCodeBtn    = $('copy-code-btn');
  var copyOutputBtn  = $('copy-output-btn');
  var clearOutputBtn = $('clear-output-btn');
  var resetBtn       = $('reset-btn');
  var downloadBtn    = $('download-btn');
  var themeToggle    = $('theme-toggle');
  var execInfo       = $('exec-info');
  var editorMount    = $('editor-mount');

  /* ================================================================
     STATE
     ================================================================ */
  var isRunning   = false;
  var currentLang = 'python';
  var editor      = null;
  var cmReady     = false;
  var saveTimer   = null;

  /* ================================================================
     THEME SYSTEM
     ================================================================ */
  function getStoredTheme() {
    try { return localStorage.getItem(STORE + 'theme'); } catch (e) { return null; }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORE + 'theme', theme); } catch (e) {}
    if (editor && cmReady) {
      editor.setOption('theme', theme === 'light' ? 'default' : 'dracula');
    }
  }

  function initTheme() {
    var stored = getStoredTheme();
    if (stored === 'dark' || stored === 'light') { applyTheme(stored); return; }
    var preferLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(preferLight ? 'light' : 'dark');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
  }

  /* ================================================================
     CODEMIRROR 5 INITIALIZATION
     ================================================================ */
  function initCM() {
    if (typeof CodeMirror === 'undefined') return false;
    var l     = LANG[currentLang];
    var theme = (document.documentElement.getAttribute('data-theme') || 'dark') === 'light' ? 'default' : 'dracula';
    var ta    = document.createElement('textarea');
    ta.value     = loadCode() || l.defaultCode;
    ta.className = 'compiler__textarea-fallback';
    ta.setAttribute('aria-label', 'Code editor');
    ta.spellcheck = false;
    editorMount.appendChild(ta);

    try {
      editor = CodeMirror.fromTextArea(ta, {
        mode:              l.mode,
        theme:             theme,
        lineNumbers:       true,
        lineWrapping:      false,
        matchBrackets:     true,
        autoCloseBrackets: true,
        foldGutter:        true,
        gutters:           ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        styleActiveLine:   true,
        indentUnit:        2,
        tabSize:           2,
        indentWithTabs:    false,
        smartIndent:       true,
        extraKeys: {
          'Tab':       function (cm) { if (cm.somethingSelected()) cm.indentSelection('add'); else cm.replaceSelection('  ', 'end'); },
          'Shift-Tab': function (cm) { cm.indentSelection('subtract'); },
          'Ctrl-Enter': runCode,
          'Cmd-Enter':  runCode
        }
      });
      var saved = loadCode();
      if (saved !== null) editor.setValue(saved);
      editor.on('change', debounceSave);
      ta.style.display = 'none';
      cmReady = true;
      return true;
    } catch (err) {
      ta.style.display = '';
      setupFallback(ta);
      return false;
    }
  }

  function setupFallback(ta) {
    ta.addEventListener('input', debounceSave);
    ta.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      var s = ta.selectionStart, end = ta.selectionEnd;
      if (e.shiftKey) {
        var before = ta.value.substring(0, s);
        var ls = before.lastIndexOf('\n') + 1;
        if (ta.value.substring(ls, ls + 2) === '  ') {
          ta.value = ta.value.substring(0, ls) + ta.value.substring(ls + 2);
          ta.selectionStart = s - 2;
          ta.selectionEnd   = end - 2;
        }
      } else {
        ta.value = ta.value.substring(0, s) + '  ' + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = s + 2;
      }
    });
  }

  function waitForCM() {
    var attempts = 0;
    var iv = setInterval(function () {
      attempts++;
      if (typeof CodeMirror !== 'undefined') {
        clearInterval(iv); initCM();
      } else if (attempts >= 100) {
        clearInterval(iv);
        var ta = document.createElement('textarea');
        ta.value     = loadCode() || LANG[currentLang].defaultCode;
        ta.className = 'compiler__textarea-fallback';
        ta.setAttribute('aria-label', 'Code editor');
        ta.spellcheck = false;
        editorMount.appendChild(ta);
        setupFallback(ta);
      }
    }, 100);
  }

  function getCode() {
    if (editor && cmReady) return editor.getValue();
    var ta = editorMount && editorMount.querySelector('.compiler__textarea-fallback');
    return ta ? ta.value : '';
  }

  function setCode(code) {
    if (editor && cmReady) { editor.setValue(code); return; }
    var ta = editorMount && editorMount.querySelector('.compiler__textarea-fallback');
    if (ta) ta.value = code;
  }

  function setMode(mode) {
    if (editor && cmReady) editor.setOption('mode', mode);
  }

  /* ================================================================
     LOCALSTORAGE PERSISTENCE
     ================================================================ */
  function saveCode() {
    try {
      localStorage.setItem(STORE + 'code_' + currentLang, getCode());
      localStorage.setItem(STORE + 'lang', currentLang);
      if (stdinInput) localStorage.setItem(STORE + 'stdin_' + currentLang, stdinInput.value);
    } catch (e) {}
  }

  function loadCode() {
    try { return localStorage.getItem(STORE + 'code_' + currentLang); } catch (e) { return null; }
  }

  function loadStdin() {
    try { return localStorage.getItem(STORE + 'stdin_' + currentLang); } catch (e) { return null; }
  }

  function debounceSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveCode, SAVE_MS);
  }

  /* ================================================================
     LANGUAGE SWITCHING
     ================================================================ */
  function updateVersion() {
    var l = LANG[langSelect ? langSelect.value : currentLang];
    if (l && langVersion) langVersion.textContent = 'v' + l.version;
  }

  function switchLang(newLang) {
    if (newLang === currentLang) return;
    saveCode();
    currentLang = newLang;
    updateVersion();
    var l = LANG[currentLang];
    if (!l) return;
    var saved = loadCode();
    setCode(saved !== null ? saved : l.defaultCode);
    setMode(l.mode);
    if (stdinInput) stdinInput.value = loadStdin() || '';
  }

  if (langSelect) {
    langSelect.addEventListener('change', function () { switchLang(langSelect.value); });
  }

  /* ================================================================
     STDIN TOGGLE
     ================================================================ */
  if (stdinToggle && stdinPanel) {
    stdinToggle.addEventListener('click', function () {
      var open = stdinPanel.classList.contains('is-open');
      stdinPanel.classList.toggle('is-open', !open);
      stdinPanel.setAttribute('aria-hidden',   open ? 'true'  : 'false');
      stdinToggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      stdinToggle.classList.toggle('is-active', !open);
      if (!open && stdinInput) stdinInput.focus();
    });
  }
  if (stdinInput) stdinInput.addEventListener('input', debounceSave);

  /* ================================================================
     OUTPUT HELPERS
     ================================================================ */
  function setRunning(state) {
    isRunning = state;
    if (runBtn) runBtn.classList.toggle('is-running', state);
  }

  function setInfo(text, type) {
    if (!execInfo) return;
    execInfo.textContent = text;
    execInfo.className   = 'compiler__exec-info' +
      (type === 'success' ? ' is-success' : type === 'error' ? ' is-error' : '');
  }

  function renderOutput(text, cls) {
    if (!outputArea) return;
    var ph = outputArea.querySelector('.compiler__output-placeholder');
    if (ph) outputArea.textContent = '';

    var truncated = false;
    if (text.length > MAX_OUT) { text = text.substring(0, MAX_OUT); truncated = true; }

    if (text.length > CHUNK) {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < text.length; i += CHUNK) {
        var sp = document.createElement('span');
        sp.className   = cls || 'output-stdout';
        sp.textContent = text.substring(i, i + CHUNK);
        frag.appendChild(sp);
      }
      outputArea.appendChild(frag);
    } else {
      var el = document.createElement('span');
      el.className   = cls || 'output-stdout';
      el.textContent = text;
      outputArea.appendChild(el);
    }

    if (truncated) {
      var note       = document.createElement('span');
      note.className = 'output-info';
      note.textContent = '\n\n[Output truncated at ' + MAX_OUT + ' characters]';
      outputArea.appendChild(note);
    }
    outputArea.scrollTop = outputArea.scrollHeight;
  }

  function clearOutput() {
    if (outputArea) {
      outputArea.innerHTML = '<span class="compiler__output-placeholder">Press Run or Ctrl+Enter to execute your code...</span>';
    }
    setInfo('', '');
  }

  /* ================================================================
     CLIPBOARD
     ================================================================ */
  function copyText(text, btn) {
    if (!text) return;
    function done() {
      if (!btn) return;
      btn.classList.add('is-copied');
      setTimeout(function () { btn.classList.remove('is-copied'); }, 1500);
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text, done); });
    } else { fallbackCopy(text, done); }
  }

  function fallbackCopy(text, cb) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); if (cb) cb();
    } catch (e) {}
  }

  /* ================================================================
     DOWNLOAD CODE
     ================================================================ */
  function downloadCode() {
    var code = getCode(); if (!code.trim()) return;
    var l = LANG[currentLang]; if (!l) return;
    var blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = l.file; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
  }

  /* ================================================================
     SCRIPT LOADER — injects a <script> tag and calls back
     ================================================================ */
  function loadScript(url, cb) {
    var s = document.createElement('script');
    s.src     = url;
    s.onload  = function () { cb(null); };
    s.onerror = function () { cb(new Error('Failed to load ' + url)); };
    document.head.appendChild(s);
  }

  /* ================================================================
     ENGINE LOADERS — lazy, queue-based, cached after first load
     ================================================================ */

  /* --- Pyodide (Python) --- */
  function getPyodide(cb) {
    if (_py) return cb(null, _py);
    _pyQ.push(cb);
    if (_pyBusy) return;
    _pyBusy = true;
    loadScript(PYODIDE_URL, function (err) {
      if (err) {
        _pyBusy = false;
        var q = _pyQ.splice(0);
        return q.forEach(function (f) { f(err); });
      }
      window.loadPyodide({ indexURL: PYODIDE_INDEX })
        .then(function (py) {
          _py = py;
          var q = _pyQ.splice(0);
          q.forEach(function (f) { f(null, py); });
        })
        .catch(function (e) {
          _pyBusy = false;
          var q = _pyQ.splice(0);
          q.forEach(function (f) { f(e); });
        });
    });
  }

  /* --- JSCPP (C / C++) --- */
  function getJSCPP(cb) {
    if (_cpp) return cb(null, _cpp);
    _cppQ.push(cb);
    if (_cppBusy) return;
    _cppBusy = true;
    loadScript(JSCPP_URL, function (err) {
      if (err) {
        _cppBusy = false;
        var q = _cppQ.splice(0);
        return q.forEach(function (f) { f(err); });
      }
      _cpp = window.JSCPP;
      var q = _cppQ.splice(0);
      q.forEach(function (f) { f(null, _cpp); });
    });
  }

  /* --- SQL.js (SQLite WASM) --- */
  function getSqlJs(cb) {
    if (_sql) return cb(null, _sql);
    _sqlQ.push(cb);
    if (_sqlBusy) return;
    _sqlBusy = true;
    loadScript(SQLJS_URL, function (err) {
      if (err) {
        _sqlBusy = false;
        var q = _sqlQ.splice(0);
        return q.forEach(function (f) { f(err); });
      }
      window.initSqlJs({ locateFile: function () { return SQLJS_WASM; } })
        .then(function (SQL) {
          _sql = SQL;
          var q = _sqlQ.splice(0);
          q.forEach(function (f) { f(null, SQL); });
        })
        .catch(function (e) {
          _sqlBusy = false;
          var q = _sqlQ.splice(0);
          q.forEach(function (f) { f(e); });
        });
    });
  }

  /* ================================================================
     JAVASCRIPT EXECUTION — Blob Web Worker + new Function() fallback
     ================================================================ */
  function executeJavaScript(code, stdin, cb) {
    var stdinLines = stdin ? stdin.split('\n') : [];
    var t0 = performance.now();

    /* Worker setup code (no escaping needed — passed as Blob) */
    var setup = [
      'var __out = [], __stdin = ' + JSON.stringify(stdinLines) + ', __idx = 0;',
      'function __fmt(a) {',
      '  if (a === null) return "null";',
      '  if (a === undefined) return "undefined";',
      '  if (typeof a === "object") { try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); } }',
      '  return String(a);',
      '}',
      'function __args(a) { return Array.prototype.slice.call(a).map(__fmt).join(" "); }',
      'var console = {',
      '  log:   function () { __out.push(__args(arguments)); },',
      '  error: function () { __out.push(__args(arguments)); },',
      '  warn:  function () { __out.push(__args(arguments)); },',
      '  info:  function () { __out.push(__args(arguments)); },',
      '  debug: function () { __out.push(__args(arguments)); },',
      '  clear: function () { __out = []; },',
      '  table: function (d) { try { __out.push(JSON.stringify(d, null, 2)); } catch(e) { __out.push(String(d)); } },',
      '  dir:   function (d) { try { __out.push(JSON.stringify(d, null, 2)); } catch(e) { __out.push(String(d)); } },',
      '  assert:function (ok, m) { if (!ok) __out.push("Assertion failed: " + (m || "")); }',
      '};',
      'var prompt  = function () { return __idx < __stdin.length ? __stdin[__idx++] : ""; };',
      'var alert   = function (m) { __out.push(m !== undefined ? String(m) : ""); };',
      'var confirm = function () { return true; };',
      'try {'
    ].join('\n');

    var teardown = [
      '  self.postMessage({ ok: 1, out: __out.join("\\n"), err: "" });',
      '} catch (e) {',
      '  self.postMessage({ ok: 0, out: __out.join("\\n"), err: e instanceof Error ? (e.stack || e.message) : String(e) });',
      '}'
    ].join('\n');

    if (window.Worker && window.URL && window.URL.createObjectURL) {
      var blob   = new Blob([setup, '\n', code, '\n', teardown], { type: 'application/javascript' });
      var url    = URL.createObjectURL(blob);
      var worker = new Worker(url);
      var done   = false;

      var timer = setTimeout(function () {
        if (done) return;
        done = true;
        worker.terminate();
        URL.revokeObjectURL(url);
        cb({ stdout: '', stderr: 'Execution timed out (' + (JS_TIMEOUT / 1000) + 's).', exitCode: 1, elapsed: ((performance.now() - t0) / 1000).toFixed(3) });
      }, JS_TIMEOUT);

      worker.onmessage = function (e) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        worker.terminate();
        URL.revokeObjectURL(url);
        var d = e.data;
        cb({ stdout: d.out || '', stderr: d.err || '', exitCode: d.ok ? 0 : 1, elapsed: ((performance.now() - t0) / 1000).toFixed(3) });
      };

      worker.onerror = function (e) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        worker.terminate();
        URL.revokeObjectURL(url);
        cb({ stdout: '', stderr: e.message || 'Worker error', exitCode: 1, elapsed: ((performance.now() - t0) / 1000).toFixed(3) });
      };
      return;
    }

    /* Fallback: new Function() — no Worker support */
    var lines = [], stdinArr = stdinLines.slice(), idx = 0, exitCode = 0, stderrText = '';
    function fmt(a) {
      if (a === null) return 'null'; if (a === undefined) return 'undefined';
      if (typeof a === 'object') { try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); } }
      return String(a);
    }
    function argsStr(argv) { return Array.prototype.slice.call(argv).map(fmt).join(' '); }
    var mock = {
      log:   function () { lines.push(argsStr(arguments)); },
      error: function () { lines.push(argsStr(arguments)); },
      warn:  function () { lines.push(argsStr(arguments)); },
      info:  function () { lines.push(argsStr(arguments)); },
      debug: function () { lines.push(argsStr(arguments)); },
      clear: function () { lines = []; },
      table: function (d) { try { lines.push(JSON.stringify(d, null, 2)); } catch(e) { lines.push(String(d)); } },
      dir:   function (d) { try { lines.push(JSON.stringify(d, null, 2)); } catch(e) { lines.push(String(d)); } },
      assert:function (ok, m) { if (!ok) lines.push('Assertion failed: ' + (m || '')); }
    };
    try {
      /* jshint ignore:start */
      (new Function('console', 'prompt', 'alert', 'confirm', code))(
        mock,
        function () { return idx < stdinArr.length ? stdinArr[idx++] : ''; },
        function (m) { lines.push(m !== undefined ? String(m) : ''); },
        function ()  { return true; }
      );
      /* jshint ignore:end */
    } catch (e) { exitCode = 1; stderrText = e instanceof Error ? (e.stack || e.message) : String(e); }
    cb({ stdout: lines.join('\n'), stderr: stderrText, exitCode: exitCode, elapsed: ((performance.now() - t0) / 1000).toFixed(3) });
  }

  /* ================================================================
     PYTHON EXECUTION — Pyodide WASM
     Uses a Python wrapper that captures stdout/stderr via io.StringIO
     ================================================================ */
  var PY_WRAPPER = [
    'import sys, io, traceback',
    '__out = io.StringIO()',
    '__err = io.StringIO()',
    'sys.stdout = __out',
    'sys.stderr = __err',
    'sys.stdin  = io.StringIO(__vc_stdin)',
    '__vc_exit  = 0',
    'try:',
    '    exec(compile(__vc_code, "<stdin>", "exec"))',
    'except SystemExit as _e:',
    '    __vc_exit = int(_e.code) if isinstance(_e.code, int) else 0',
    'except Exception:',
    '    __vc_exit = 1',
    '    __err.write(traceback.format_exc())',
    'finally:',
    '    sys.stdout = sys.__stdout__',
    '    sys.stderr = sys.__stderr__'
  ].join('\n');

  function executePython(code, stdin, cb) {
    if (outputArea) { outputArea.textContent = ''; renderOutput('Loading Python runtime — first run takes ~10 s…', 'output-info'); }
    setInfo('Loading Python…', '');

    getPyodide(function (err, py) {
      if (err) return cb({ stdout: '', stderr: 'Failed to load Python: ' + err.message, exitCode: 1, elapsed: '0.000' });

      var t0 = performance.now();
      try {
        py.globals.set('__vc_code',  code);
        py.globals.set('__vc_stdin', stdin || '');
        py.runPython(PY_WRAPPER);
        var stdout   = py.runPython('__out.getvalue()');
        var stderr   = py.runPython('__err.getvalue()');
        var exitCode = py.runPython('__vc_exit');
        cb({
          stdout:   String(stdout || '').replace(/\n$/, ''),
          stderr:   String(stderr || '').replace(/\n$/, ''),
          exitCode: exitCode || 0,
          elapsed:  ((performance.now() - t0) / 1000).toFixed(3)
        });
      } catch (e) {
        cb({ stdout: '', stderr: e.message || String(e), exitCode: 1, elapsed: ((performance.now() - t0) / 1000).toFixed(3) });
      }
    });
  }

  /* ================================================================
     C / C++ EXECUTION — JSCPP interpreter
     ================================================================ */
  function executeCpp(code, stdin, cb) {
    if (outputArea) { outputArea.textContent = ''; renderOutput('Loading C/C++ runtime…', 'output-info'); }
    setInfo('Loading C/C++…', '');

    getJSCPP(function (err, JSCPP) {
      if (err) return cb({ stdout: '', stderr: 'Failed to load C/C++ runtime: ' + err.message, exitCode: 1, elapsed: '0.000' });

      var t0 = performance.now();
      var output = '';
      var config = { stdio: { write: function (s) { output += s; } } };

      try {
        var exitCode = JSCPP.run(code, stdin || '', config);
        cb({
          stdout:   output,
          stderr:   '',
          exitCode: (typeof exitCode === 'number' ? exitCode : 0),
          elapsed:  ((performance.now() - t0) / 1000).toFixed(3)
        });
      } catch (e) {
        cb({ stdout: output, stderr: e.message || String(e), exitCode: 1, elapsed: ((performance.now() - t0) / 1000).toFixed(3) });
      }
    });
  }

  /* ================================================================
     SQL EXECUTION — SQL.js (SQLite WASM)
     ================================================================ */
  function executeSql(code, cb) {
    if (outputArea) { outputArea.textContent = ''; renderOutput('Loading SQL runtime…', 'output-info'); }
    setInfo('Loading SQL…', '');

    getSqlJs(function (err, SQL) {
      if (err) return cb({ stdout: '', stderr: 'Failed to load SQL runtime: ' + err.message, exitCode: 1, elapsed: '0.000' });

      var t0 = performance.now();
      var rows = [];
      try {
        var db      = new SQL.Database();
        var results = db.exec(code);

        if (results.length === 0) {
          rows.push('Query executed successfully.');
        } else {
          results.forEach(function (res) {
            rows.push(res.columns.join('\t|\t'));
            rows.push(res.columns.map(function () { return '---'; }).join('-+-'));
            res.values.forEach(function (row) {
              rows.push(row.map(function (v) { return v === null ? 'NULL' : String(v); }).join('\t|\t'));
            });
            rows.push('');
          });
        }
        db.close();
        cb({ stdout: rows.join('\n').trim(), stderr: '', exitCode: 0, elapsed: ((performance.now() - t0) / 1000).toFixed(3) });
      } catch (e) {
        cb({ stdout: '', stderr: e.message || String(e), exitCode: 1, elapsed: ((performance.now() - t0) / 1000).toFixed(3) });
      }
    });
  }

  /* ================================================================
     TRANSPILERS — convert language source to JavaScript, then run
     in the Web Worker.  Handles Hello-World style programs and
     common basic patterns.  Complex code may need adjustment.
     ================================================================ */

  /* Helper: shared print-buffer preamble added to all transpiled output */
  function withPrintBuf(helpers, jsBody) {
    return [
      'var __pb = "";',
      'function __w(s) { __pb += s !== undefined ? String(s) : ""; }',
      helpers || '',
      jsBody,
      'if (__pb) console.log(__pb);'
    ].join('\n');
  }

  /* ---- Java ---- */
  function transpileJava(code) {
    var js = code;
    js = js.replace(/^(package|import)\s+[^\n]+\n?/gm, '');
    js = js.replace(/System\.out\.println\s*\(/g, 'console.log(');
    js = js.replace(/System\.out\.print\s*\(/g, '__w(');
    js = js.replace(/System\.err\.println\s*\(/g, 'console.log(');
    js = js.replace(/\b(int|long|double|float|byte|short)\s+(\w+)\s*=/g, 'let $2 =');
    js = js.replace(/\bboolean\s+(\w+)\s*=/g, 'let $1 =');
    js = js.replace(/\bString\s+(\w+)\s*=/g, 'let $1 =');
    js = js.replace(/\bvar\s+(\w+)\s*=/g, 'let $1 =');
    js = js.replace(/String\.valueOf\s*\(/g, 'String(');
    js = js.replace(/Integer\.parseInt\s*\(/g, 'parseInt(');
    js = js.replace(/Integer\.toString\s*\(/g, 'String(');
    js = js.replace(/Double\.parseDouble\s*\(/g, 'parseFloat(');
    js = js.replace(/Long\.parseLong\s*\(/g, 'parseInt(');
    js = js.replace(/\bScanner\b[^;]+;\s*\n?/g, '');
    js = js.replace(/\bnew\s+Scanner\s*\([^)]*\)/g, '');
    js = js.replace(/\w+\.nextLine\s*\(\)/g, '__stdin()');
    js = js.replace(/\w+\.nextInt\s*\(\)/g, 'parseInt(__stdin())');
    js = js.replace(/\w+\.nextDouble\s*\(\)/g, 'parseFloat(__stdin())');
    js = js.replace(/public\s+class\s+\w+\s*\{/, '');
    js = js.replace(/public\s+static\s+void\s+main\s*\([^)]*\)\s*(throws\s+[\w,\s]+)?\s*\{/, '(function __main() {');
    js = js.replace(/public\s+static\s+(\w+)\s+(\w+)\s*\(/g, 'function $2(');
    js = js.replace(/private\s+static\s+(\w+)\s+(\w+)\s*\(/g, 'function $2(');
    /* Close the wrapping class brace */
    js = js.trimEnd();
    var opens  = (js.match(/\{/g) || []).length;
    var closes = (js.match(/\}/g) || []).length;
    if (opens > closes) js += '\n})();';
    else js = js.replace(/\}\s*$/, '\n})();');
    return withPrintBuf(
      'var __stdinArr = (__vc_stdin||"").split("\\n"), __stdinIdx = 0;\nfunction __stdin() { return __stdinIdx < __stdinArr.length ? __stdinArr[__stdinIdx++] : ""; }',
      js
    );
  }

  /* ---- C# ---- */
  function transpileCSharp(code) {
    var js = code;
    js = js.replace(/^using\s+[^\n]+\n?/gm, '');
    js = js.replace(/Console\.WriteLine\s*\(/g, 'console.log(');
    js = js.replace(/Console\.Write\s*\(/g, '__w(');
    js = js.replace(/Console\.ReadLine\s*\(\)/g, '__stdin()');
    js = js.replace(/Console\.ReadKey\s*\([^)]*\)/g, '');
    js = js.replace(/\b(int|long|double|float|decimal|byte|short|ushort|uint|ulong)\s+(\w+)\s*=/g, 'let $2 =');
    js = js.replace(/\bbool\s+(\w+)\s*=/g, 'let $1 =');
    js = js.replace(/\bstring\s+(\w+)\s*=/g, 'let $1 =');
    js = js.replace(/\bvar\s+(\w+)\s*=/g, 'let $1 =');
    js = js.replace(/int\.Parse\s*\(/g, 'parseInt(');
    js = js.replace(/double\.Parse\s*\(/g, 'parseFloat(');
    js = js.replace(/float\.Parse\s*\(/g, 'parseFloat(');
    js = js.replace(/Convert\.ToInt32\s*\(/g, 'parseInt(');
    js = js.replace(/Convert\.ToDouble\s*\(/g, 'parseFloat(');
    js = js.replace(/Convert\.ToString\s*\(/g, 'String(');
    js = js.replace(/namespace\s+\w+\s*\{/, '');
    js = js.replace(/class\s+\w+\s*\{/, '');
    js = js.replace(/static\s+void\s+Main\s*\([^)]*\)\s*\{/, '(function __main() {');
    js = js.replace(/static\s+(\w+)\s+(\w+)\s*\(/g, 'function $2(');
    js = js.replace(/\btrue\b/g, 'true'); js = js.replace(/\bfalse\b/g, 'false');
    js = js.replace(/\$"([^"]*)"/g, function (m, s) { return '`' + s.replace(/\{([^}]+)\}/g, '${$1}') + '`'; });
    js = js.trimEnd();
    var opens  = (js.match(/\{/g) || []).length;
    var closes = (js.match(/\}/g) || []).length;
    if (opens > closes) js += '\n})();';
    else js = js.replace(/\}\s*$/, '\n})();');
    return withPrintBuf(
      'var __stdinArr = (__vc_stdin||"").split("\\n"), __stdinIdx = 0;\nfunction __stdin() { return __stdinIdx < __stdinArr.length ? __stdinArr[__stdinIdx++] : ""; }',
      js
    );
  }

  /* ---- Go ---- */
  function transpileGo(code) {
    var js = code;
    js = js.replace(/^package\s+\w+\s*\n?/m, '');
    js = js.replace(/^import\s*\([\s\S]*?\)\s*\n?/m, '');
    js = js.replace(/^import\s+"[^"]*"\s*\n?/gm, '');
    js = js.replace(/fmt\.Println\s*\(/g, 'console.log(');
    js = js.replace(/fmt\.Fprintln\s*\(\s*\w+\s*,\s*/g, 'console.log(');
    js = js.replace(/fmt\.Printf\s*\(/g, '__printf(');
    js = js.replace(/fmt\.Fprintf\s*\([^,]+,\s*/g, '__printf(');
    js = js.replace(/fmt\.Print\s*\(/g, '__w(');
    js = js.replace(/fmt\.Scanf\s*\([^,]+,\s*&(\w+)/g, '$1 = __stdin()');
    js = js.replace(/fmt\.Scan\s*\(&(\w+)\)/g, '$1 = __stdin()');
    js = js.replace(/fmt\.Scanln\s*\(&(\w+)\)/g, '$1 = __stdin()');
    js = js.replace(/:=/g, '= ');
    js = js.replace(/\bvar\s+(\w+)\s+\w+\s*=/g, 'let $1 =');
    js = js.replace(/\bvar\s+(\w+)\s+\w+/g, 'let $1');
    js = js.replace(/func\s+main\s*\(\s*\)\s*\{/, '(function() {');
    js = js.replace(/func\s+(\w+)\s*\(([^)]*)\)\s*(?:\([^)]*\)|\w+)?\s*\{/g, 'function $1($2) {');
    js = js.replace(/\bnil\b/g, 'null');
    js = js.trimEnd();
    if (!js.endsWith('})();')) js += '\n})();';
    return withPrintBuf(
      'var __stdinArr = (__vc_stdin||"").split("\\n"), __stdinIdx = 0;\nfunction __stdin() { return __stdinIdx < __stdinArr.length ? __stdinArr[__stdinIdx++] : ""; }\n' +
      'function __printf(fmt) { var a = Array.prototype.slice.call(arguments, 1), i = 0; var r = String(fmt).replace(/%[vsdftgq]/g, function() { return a[i] !== undefined ? String(a[i++]) : ""; }); console.log(r.replace(/\\n$/, "")); }',
      js
    );
  }

  /* ---- Rust ---- */
  function transpileRust(code) {
    var js = code;
    /* println!("{}", x) */
    js = js.replace(/println!\s*\(\s*"([^"]*)"\s*\)/g, 'console.log("$1")');
    js = js.replace(/println!\s*\(\s*"([^"]*)"(?:\s*,\s*([^)]+))?\s*\)/g, function (m, fmt, args) {
      if (!args) return 'console.log("' + fmt + '")';
      var parts = args.split(',').map(function (a) { return a.trim(); });
      var i = 0, out = '"', chunk = fmt.split('{}');
      chunk.forEach(function (c, idx) {
        out += c.replace(/"/g, '\\"');
        if (idx < chunk.length - 1) out += '" + ' + (parts[i] !== undefined ? parts[i++] : '""') + ' + "';
      });
      out += '"';
      return 'console.log(' + out + ')';
    });
    js = js.replace(/print!\s*\(\s*"([^"]*)"\s*\)/g, '__w("$1")');
    js = js.replace(/eprintln!\s*\(/g, 'console.log(');
    js = js.replace(/let\s+mut\s+(\w+)\s*(?::\s*[\w<>&]+)?\s*=/g, 'let $1 =');
    js = js.replace(/let\s+(\w+)\s*(?::\s*[\w<>&]+)?\s*=/g, 'const $1 =');
    js = js.replace(/fn\s+main\s*\(\s*\)\s*\{/, '(function() {');
    js = js.replace(/fn\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*[\w<>&]+)?\s*\{/g, 'function $1($2) {');
    js = js.replace(/(\w+)\s*:\s*(?:&?(?:mut\s+)?(?:str|String|i32|i64|u32|u64|f32|f64|bool|usize|isize))/g, '$1');
    js = js.replace(/\.to_string\s*\(\s*\)/g, '');
    js = js.replace(/\.as_str\s*\(\s*\)/g, '');
    js = js.replace(/\.parse::<\w+>\(\)\.unwrap\(\)/g, '');
    js = js.replace(/\bprintln!\s*\(\)/g, 'console.log("")');
    js = js.trimEnd();
    if (!js.endsWith('})();')) js += '\n})();';
    return withPrintBuf('', js);
  }

  /* ---- Kotlin ---- */
  function transpileKotlin(code) {
    var js = code;
    js = js.replace(/println\s*\(/g, 'console.log(');
    js = js.replace(/print\s*\(/g, '__w(');
    js = js.replace(/readLine\s*\(\)/g, '__stdin()');
    js = js.replace(/\bval\s+(\w+)\s*(?::\s*[\w<>?]+)?\s*=/g, 'const $1 =');
    js = js.replace(/\bvar\s+(\w+)\s*(?::\s*[\w<>?]+)?\s*=/g, 'let $1 =');
    js = js.replace(/fun\s+main\s*\([^)]*\)\s*\{/, '(function() {');
    js = js.replace(/fun\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*\w+)?\s*\{/g, 'function $1($2) {');
    js = js.replace(/\$\{([^}]+)\}/g, '" + ($1) + "');
    js = js.replace(/\$(\w+)/g, '" + $1 + "');
    js = js.replace(/\.toInt\s*\(\s*\)/g, ' | 0');
    js = js.replace(/\.toDouble\s*\(\s*\)/g, '');
    js = js.replace(/\.toString\s*\(\s*\)/g, '.toString()');
    js = js.trimEnd();
    if (!js.endsWith('})();')) js += '\n})();';
    return withPrintBuf(
      'var __stdinArr = (__vc_stdin||"").split("\\n"), __stdinIdx = 0;\nfunction __stdin() { return __stdinIdx < __stdinArr.length ? __stdinArr[__stdinIdx++] : ""; }',
      js
    );
  }

  /* ---- Swift ---- */
  function transpileSwift(code) {
    var js = code;
    js = js.replace(/print\s*\(([^)]+),\s*terminator\s*:\s*""\s*\)/g, '__w($1)');
    js = js.replace(/print\s*\(/g, 'console.log(');
    js = js.replace(/\blet\s+(\w+)\s*(?::\s*\w+)?\s*=/g, 'const $1 =');
    js = js.replace(/\bvar\s+(\w+)\s*(?::\s*\w+)?\s*=/g, 'let $1 =');
    js = js.replace(/func\s+(\w+)\s*\(([^)]*)\)\s*(?:->\s*\w+)?\s*\{/g, 'function $1($2) {');
    js = js.replace(/\\\(([^)]+)\)/g, '" + ($1) + "');
    js = js.replace(/\breadLine\s*\(\s*\)/g, '__stdin()');
    js = js.replace(/\bInt\s*\(\s*([^)]+)\s*\)/g, 'parseInt($1)');
    js = js.replace(/\bDouble\s*\(\s*([^)]+)\s*\)/g, 'parseFloat($1)');
    js = js.replace(/\bString\s*\(\s*([^)]+)\s*\)/g, 'String($1)');
    return withPrintBuf(
      'var __stdinArr = (__vc_stdin||"").split("\\n"), __stdinIdx = 0;\nfunction __stdin() { return __stdinIdx < __stdinArr.length ? __stdinArr[__stdinIdx++] : null; }',
      js
    );
  }

  /* ---- Scala ---- */
  function transpileScala(code) {
    var js = code;
    js = js.replace(/^import\s+[^\n]+\n?/gm, '');
    js = js.replace(/println\s*\(/g, 'console.log(');
    js = js.replace(/print\s*\(/g, '__w(');
    js = js.replace(/\bval\s+(\w+)\s*(?::\s*\w+)?\s*=/g, 'const $1 =');
    js = js.replace(/\bvar\s+(\w+)\s*(?::\s*\w+)?\s*=/g, 'let $1 =');
    js = js.replace(/object\s+\w+\s+extends\s+App\s*\{/, '(function() {');
    js = js.replace(/def\s+main\s*\([^)]*\)\s*(?::\s*\w+)?\s*=?\s*\{/, '(function() {');
    js = js.replace(/def\s+(\w+)\s*\(([^)]*)\)\s*(?::\s*\w+)?\s*=?\s*\{/g, 'function $1($2) {');
    js = js.replace(/s"([^"]*)"/g, function (m, s) {
      return '"' + s.replace(/\$\{([^}]+)\}/g, '" + ($1) + "').replace(/\$(\w+)/g, '" + $1 + "') + '"';
    });
    js = js.trimEnd();
    var opens  = (js.match(/\{/g) || []).length;
    var closes = (js.match(/\}/g) || []).length;
    if (opens > closes) js += '\n})();';
    else js = js.replace(/\}\s*$/, '\n})();');
    return withPrintBuf('', js);
  }

  /* ---- PHP ---- */
  function transpilePhp(code) {
    var js = code;
    js = js.replace(/<\?php\s*/g, '').replace(/<\?/g, '').replace(/\?>/g, '');
    /* echo "..." with dot-concat */
    js = js.replace(/\becho\s+((?:[^;"\n]|"[^"]*"|'[^']*')+)\s*;/g, function (m, expr) {
      /* Replace PHP . concat with + */
      var e2 = expr.replace(/\s*\.\s*/g, ' + ');
      /* Remove trailing \n from echo expressions (will be added by console.log) */
      e2 = e2.replace(/\s*\+\s*"\\n"$/, '').replace(/\s*\+\s*'\\n'$/, '');
      return 'console.log(' + e2 + ');';
    });
    js = js.replace(/\bprint\s*\(/g, '__w(');
    js = js.replace(/\$(\w+)/g, '$1');          /* Remove $ sigil */
    js = js.replace(/\bintval\s*\(/g, 'parseInt(');
    js = js.replace(/\bfloatval\s*\(/g, 'parseFloat(');
    js = js.replace(/\bstrval\s*\(/g, 'String(');
    js = js.replace(/\bstrlen\s*\(/g, '__strlen(');
    js = js.replace(/\bstrtolower\s*\(/g, '(__strtolower(');
    js = js.replace(/\bstrtoupper\s*\(/g, '(__strtoupper(');
    js = js.replace(/\btrim\s*\(/g, '(__trim(');
    js = js.replace(/\bcount\s*\(/g, '(__count(');
    js = js.replace(/\b(null|NULL)\b/g, 'null');
    js = js.replace(/\btrue\b/g, 'true'); js = js.replace(/\bfalse\b/g, 'false');
    js = js.replace(/\barray\s*\(/g, '[');
    return withPrintBuf(
      'function __strlen(s){return String(s).length;}\n' +
      'function __strtolower(s){return String(s).toLowerCase();}\n' +
      'function __strtoupper(s){return String(s).toUpperCase();}\n' +
      'function __trim(s){return String(s).trim();}\n' +
      'function __count(a){return Array.isArray(a)?a.length:0;}',
      js
    );
  }

  /* ---- Ruby ---- */
  function transpileRuby(code) {
    var js = code;
    js = js.replace(/#[^\n]*/g, '');   /* strip comments */
    /* puts expr — add closing paren */
    js = js.replace(/^(\s*)puts\s+((?:[^(\n]|"[^"]*"|'[^']*')+)$/gm, function (m, sp, expr) {
      return sp + 'console.log(' + expr.trim() + ');';
    });
    js = js.replace(/\bputs\s*\(/g, 'console.log(');
    js = js.replace(/^(\s*)print\s+((?:[^(\n]|"[^"]*"|'[^']*')+)$/gm, function (m, sp, expr) {
      return sp + '__w(' + expr.trim() + ');';
    });
    js = js.replace(/\bprint\s*\(/g, '__w(');
    js = js.replace(/\bgets\s*\.chomp/g, '__stdin()');
    js = js.replace(/\bgets\b/g, '__stdin()');
    js = js.replace(/\.to_i\b/g, ' | 0');
    js = js.replace(/\.to_f\b/g, '');
    js = js.replace(/\.to_s\b/g, '.toString()');
    js = js.replace(/\.upcase\b/g, '.toUpperCase()');
    js = js.replace(/\.downcase\b/g, '.toLowerCase()');
    js = js.replace(/\.length\b/g, '.length');
    js = js.replace(/"([^"]*#\{[^}]+\}[^"]*)"/g, function (m, s) {
      return '`' + s.replace(/#\{([^}]+)\}/g, '${$1}') + '`';
    });
    js = js.replace(/\bnil\b/g, 'null');
    js = js.replace(/\band\b/g, '&&'); js = js.replace(/\bor\b/g, '||');
    return withPrintBuf(
      'var __stdinArr = (__vc_stdin||"").split("\\n"), __stdinIdx = 0;\nfunction __stdin() { return __stdinIdx < __stdinArr.length ? __stdinArr[__stdinIdx++] : ""; }',
      js
    );
  }

  /* ---- Perl ---- */
  function transpilePerl(code) {
    var js = code;
    js = js.replace(/^use\s+\w+[^;]*;\s*\n?/gm, '');
    js = js.replace(/print\s+"([^"\\]*)\\n"\s*;/g, 'console.log("$1");');
    js = js.replace(/print\s+'([^'\\]*)\\n'\s*;/g, "console.log('$1');");
    js = js.replace(/say\s+/g, 'console.log(');
    js = js.replace(/print\s+([^;]+);/g, '__w($1);');
    js = js.replace(/\$(\w+)/g, '$1');
    js = js.replace(/@(\w+)/g, '$1');
    js = js.replace(/\bmy\s+/g, 'let ');
    js = js.replace(/\bchomp\s*\((\w+)\)/g, '$1 = String($1).replace(/[\\r\\n]+$/, "")');
    js = js.replace(/<STDIN>/g, '__stdin()');
    return withPrintBuf(
      'var __stdinArr = (__vc_stdin||"").split("\\n"), __stdinIdx = 0;\nfunction __stdin() { return __stdinIdx < __stdinArr.length ? __stdinArr[__stdinIdx++] : ""; }',
      js
    );
  }

  /* ---- R ---- */
  function transpileR(code) {
    var js = code;
    js = js.replace(/cat\s*\("([^"\\]*)\\n"\s*\)/g, 'console.log("$1")');
    js = js.replace(/cat\s*\("([^"]*)"\s*\)/g, '__w("$1")');
    js = js.replace(/cat\s*\(([^)]+)\)/g, '__w($1)');
    js = js.replace(/print\s*\(([^)]+)\)/g, 'console.log($1)');
    js = js.replace(/message\s*\(([^)]+)\)/g, 'console.log($1)');
    js = js.replace(/paste0\s*\(([^)]+)\)/g, '[$1].join("")');
    js = js.replace(/paste\s*\(([^)]+)\)/g, '[$1].join(" ")');
    js = js.replace(/\bc\s*\(([^)]+)\)/g, '[$1]');
    js = js.replace(/<-\s*/g, '= ');
    js = js.replace(/\bTRUE\b/g, 'true'); js = js.replace(/\bFALSE\b/g, 'false');
    js = js.replace(/\bNULL\b/g, 'null'); js = js.replace(/\bNA\b/g, 'null');
    js = js.replace(/\bfor\s*\((\w+)\s+in\s+(\d+):(\d+)\)/g, 'for (let $1 = $2; $1 <= $3; $1++)');
    return withPrintBuf('', js);
  }

  /* ---- TypeScript — strip types, run as JS ---- */
  function transpileTypeScript(code) {
    var js = code;
    js = js.replace(/^import\s+type\s+[^;]+;\s*\n?/gm, '');
    js = js.replace(/^(?:export\s+)?(?:interface|type)\s+\w+[^{]*\{[\s\S]*?\}\s*\n?/gm, '');
    js = js.replace(/:\s*(?:string|number|boolean|void|any|never|unknown|null|undefined|object|bigint)(?:\[\]|\s*\|\s*null|\s*\|\s*undefined)*/g, '');
    js = js.replace(/<(?:[A-Z]\w*(?:,\s*)?)+>/g, '');
    js = js.replace(/\s+as\s+\w+/g, '');
    js = js.replace(/\b(?:public|private|protected|readonly|override|abstract)\s+/g, '');
    js = js.replace(/\)\s*:\s*\w+(?:\[\])?\s*\{/g, ') {');
    return js;
  }

  /* ---- Lua ---- */
  function transpileLua(code) {
    var js = code;
    js = js.replace(/--[^\n]*/g, '');
    js = js.replace(/\bprint\s*\(/g, 'console.log(');
    js = js.replace(/\bio\.write\s*\(/g, '__w(');
    js = js.replace(/\bio\.read\s*\(\)/g, '__stdin()');
    js = js.replace(/\btostring\s*\(/g, 'String(');
    js = js.replace(/\btonumber\s*\(/g, 'Number(');
    js = js.replace(/\bstring\.len\s*\(/g, '__strlen(');
    js = js.replace(/\bstring\.upper\s*\(/g, '__upper(');
    js = js.replace(/\bstring\.lower\s*\(/g, '__lower(');
    js = js.replace(/\btable\.insert\s*\((\w+)\s*,\s*([^)]+)\)/g, '$1.push($2)');
    js = js.replace(/\btable\.remove\s*\((\w+)\)/g, '$1.pop()');
    js = js.replace(/#(\w+)/g, '$1.length');
    js = js.replace(/\band\b/g, '&&'); js = js.replace(/\bor\b/g, '||'); js = js.replace(/\bnot\s+/g, '!');
    js = js.replace(/~=/g, '!=='); js = js.replace(/\.\./g, '+');
    js = js.replace(/\blocal\s+(\w+)\s*=/g, 'let $1 =');
    js = js.replace(/\blocal\s+(\w+)/g, 'let $1');
    js = js.replace(/function\s+(\w+)\s*\(([^)]*)\)/g, 'function $1($2)');
    js = js.replace(/\bdo\b(?!\s*\{)/g, '{');
    js = js.replace(/\bthen\b/g, '{');
    js = js.replace(/\belseif\b/g, '} else if');
    js = js.replace(/\bend\b/g, '}');
    js = js.replace(/for\s+(\w+)\s*=\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+))?\s*do/g, function (m, v, s, e, st) {
      return 'for (let ' + v + ' = ' + s + '; ' + v + ' <= ' + e + '; ' + v + ' += ' + (st || '1') + ') {';
    });
    return withPrintBuf(
      'var __stdinArr = (__vc_stdin||"").split("\\n"), __stdinIdx = 0;\nfunction __stdin() { return __stdinIdx < __stdinArr.length ? __stdinArr[__stdinIdx++] : ""; }\n' +
      'function __strlen(s){return String(s).length;}\nfunction __upper(s){return String(s).toUpperCase();}\nfunction __lower(s){return String(s).toLowerCase();}',
      js
    );
  }

  /* ---- Bash ---- */
  function transpileBash(code) {
    var js = code;
    js = js.replace(/^#![^\n]*\n?/, '');  /* shebang */
    js = js.replace(/#[^\n]*/g, '');
    js = js.replace(/echo\s+"([^"\\]*)"/g, 'console.log("$1")');
    js = js.replace(/echo\s+'([^'\\]*)'/g, "console.log('$1')");
    js = js.replace(/echo\s+(\S+)/g, 'console.log($1)');
    js = js.replace(/\bread\s+-r?\s*(\w+)/g, 'let $1 = __stdin()');
    js = js.replace(/\$\{(\w+)\}/g, '$1'); js = js.replace(/\$(\w+)/g, '$1');
    js = js.replace(/([A-Za-z_]\w*)\s*=\s*"([^"]*)"/g, 'let $1 = "$2"');
    js = js.replace(/([A-Za-z_]\w*)\s*=\s*'([^']*)'/g, "let $1 = '$2'");
    js = js.replace(/([A-Za-z_]\w*)\s*=\s*(\S+)/g, 'let $1 = $2');
    js = js.replace(/\bif\s+\[\[\s*(.+?)\s*\]\]\s*;?\s*then\b/g, 'if ($1) {');
    js = js.replace(/\bif\s+\[\s*(.+?)\s*\]\s*;?\s*then\b/g, 'if ($1) {');
    js = js.replace(/\belse\b/g, '} else {'); js = js.replace(/\bfi\b/g, '}');
    js = js.replace(/\bfor\s+(\w+)\s+in\s+([^;]+)\s*;?\s*do\b/g, 'for (let $1 of [$2]) {');
    js = js.replace(/\bdone\b/g, '}');
    js = js.replace(/-eq/g, '=='); js = js.replace(/-ne/g, '!=');
    js = js.replace(/-lt/g, '<');  js = js.replace(/-gt/g, '>');
    js = js.replace(/-le/g, '<='); js = js.replace(/-ge/g, '>=');
    return withPrintBuf(
      'var __stdinArr = (__vc_stdin||"").split("\\n"), __stdinIdx = 0;\nfunction __stdin() { return __stdinIdx < __stdinArr.length ? __stdinArr[__stdinIdx++] : ""; }',
      js
    );
  }

  /* ================================================================
     TRANSPILER MAP
     ================================================================ */
  var TRANSPILERS = {
    java:       transpileJava,
    csharp:     transpileCSharp,
    go:         transpileGo,
    rust:       transpileRust,
    kotlin:     transpileKotlin,
    swift:      transpileSwift,
    scala:      transpileScala,
    php:        transpilePhp,
    ruby:       transpileRuby,
    perl:       transpilePerl,
    r:          transpileR,
    typescript: transpileTypeScript,
    lua:        transpileLua,
    bash:       transpileBash
  };

  /* ================================================================
     EXECUTION ROUTER
     ================================================================ */
  function executeCode(lang, code, stdin, cb) {
    switch (lang) {
      case 'javascript': return executeJavaScript(code, stdin, cb);
      case 'python':     return executePython(code, stdin, cb);
      case 'c++':
      case 'c':          return executeCpp(code, stdin, cb);
      case 'sql':        return executeSql(code, cb);
      default:
        var transpile = TRANSPILERS[lang];
        if (!transpile) {
          return cb({ stdout: '', stderr: 'Language "' + lang + '" is not supported.', exitCode: 1, elapsed: '0.000' });
        }
        try {
          /* Inject stdin var so transpilers can reference it */
          var transpileCode = 'var __vc_stdin = ' + JSON.stringify(stdin || '') + ';\n' + transpile(code);
          executeJavaScript(transpileCode, stdin, cb);
        } catch (e) {
          cb({ stdout: '', stderr: 'Transpilation error: ' + e.message, exitCode: 1, elapsed: '0.000' });
        }
    }
  }

  /* ================================================================
     RESULT DISPLAY
     ================================================================ */
  function showResult(result) {
    if (!outputArea) return;
    outputArea.textContent = '';
    var hasOut = false;
    var isErr  = result.exitCode !== 0;

    if (result.stdout && result.stdout.trim()) {
      renderOutput(result.stdout, 'output-stdout');
      hasOut = true;
    }
    if (result.stderr && result.stderr.trim()) {
      if (hasOut) renderOutput('\n', 'output-stdout');
      renderOutput(result.stderr, 'output-stderr');
      hasOut = true; isErr = true;
    }
    if (!hasOut) {
      renderOutput(
        isErr ? 'Program exited with error (exit code ' + result.exitCode + ').' : 'Program finished with no output.',
        isErr ? 'output-error' : 'output-info'
      );
    }
    setInfo(result.elapsed + 's · exit ' + result.exitCode, isErr ? 'error' : 'success');
    setRunning(false);
  }

  /* ================================================================
     RUN CODE — main entry point
     ================================================================ */
  function runCode() {
    if (isRunning) return;

    var code = getCode().trim();
    if (!code) {
      if (outputArea) { outputArea.textContent = ''; renderOutput('No code to run.', 'output-error'); }
      return;
    }

    var l = LANG[currentLang];
    if (!l) { if (outputArea) renderOutput('Unsupported language.', 'output-error'); return; }

    saveCode();
    var stdin = stdinInput ? stdinInput.value : '';
    setRunning(true);
    if (outputArea) { outputArea.textContent = ''; renderOutput('Executing…', 'output-info'); }
    setInfo('Running…', '');

    executeCode(currentLang, code, stdin, function (result) {
      showResult(result);
    });
  }

  /* ================================================================
     EVENT LISTENERS
     ================================================================ */
  if (runBtn)         runBtn.addEventListener('click', runCode);
  if (copyCodeBtn)    copyCodeBtn.addEventListener('click', function () { copyText(getCode(), copyCodeBtn); });
  if (copyOutputBtn)  copyOutputBtn.addEventListener('click', function () { copyText(outputArea ? outputArea.textContent : '', copyOutputBtn); });
  if (clearOutputBtn) clearOutputBtn.addEventListener('click', clearOutput);
  if (downloadBtn)    downloadBtn.addEventListener('click', downloadCode);

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      var l = LANG[currentLang];
      if (l) { setCode(l.defaultCode); clearOutput(); if (stdinInput) stdinInput.value = ''; saveCode(); }
    });
  }

  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCode(); }
  });

  /* ================================================================
     INITIALIZATION
     ================================================================ */
  function init() {
    initTheme();

    try {
      var lastLang = localStorage.getItem(STORE + 'lang');
      if (lastLang && LANG[lastLang] && langSelect) {
        langSelect.value = lastLang;
        currentLang      = lastLang;
      }
    } catch (e) {}

    updateVersion();

    if (editorMount) {
      if (typeof CodeMirror !== 'undefined') initCM();
      else waitForCM();
    }

    try {
      var savedStdin = localStorage.getItem(STORE + 'stdin_' + currentLang);
      if (savedStdin && stdinInput) stdinInput.value = savedStdin;
    } catch (e) {}
  }

  init();

})();
