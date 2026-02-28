/* ==========================================================================
   CODE FORMATTER v1 — public/js/tools/code-formatter.js
   Value.Codes | Formats JSON, JS, HTML, CSS, SQL, XML client-side.
   ========================================================================== */

(function () {
  'use strict';

  /* ---- DOM ---- */
  var langSelect  = document.getElementById('cf-lang');
  var indentSelect = document.getElementById('cf-indent');
  var formatBtn   = document.getElementById('cf-format-btn');
  var minifyBtn   = document.getElementById('cf-minify-btn');
  var clearBtn    = document.getElementById('cf-clear-btn');
  var pasteBtn    = document.getElementById('cf-paste-btn');
  var copyBtn     = document.getElementById('cf-copy-btn');
  var copyOutBtn  = document.getElementById('cf-copy-output-btn');
  var downloadBtn = document.getElementById('cf-download-btn');
  var sampleBtn   = document.getElementById('cf-sample-btn');
  var inputTA     = document.getElementById('cf-input');
  var outputTA    = document.getElementById('cf-output');
  var statusDot   = document.getElementById('cf-status-dot');
  var statusText  = document.getElementById('cf-status-text');
  var errorPanel  = document.getElementById('cf-error-panel');
  var errorText   = document.getElementById('cf-error-text');
  var toast       = document.getElementById('cf-toast');
  var resizeHandle = document.getElementById('cf-resize-handle');

  if (!inputTA) return;

  var currentLang = 'json';
  var indentSize  = '  ';

  /* ---- Samples ---- */
  var SAMPLES = {
    json: '{"name":"John Doe","age":30,"email":"john@example.com","address":{"street":"123 Main St","city":"New York","zip":"10001"},"hobbies":["reading","coding","hiking"],"active":true}',
    javascript: 'function fibonacci(n){if(n<=1)return n;return fibonacci(n-1)+fibonacci(n-2);}const result=fibonacci(10);console.log("Fibonacci(10) =",result);',
    html: '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Hello</title></head><body><div class="container"><h1>Hello World</h1><p>This is a paragraph.</p><ul><li>Item 1</li><li>Item 2</li></ul></div></body></html>',
    css: '.container{max-width:1200px;margin:0 auto;padding:0 20px;}.header{background:#333;color:#fff;padding:20px;}.header h1{font-size:2rem;font-weight:bold;}.nav-link{color:#fff;text-decoration:none;margin:0 10px;}',
    sql: 'SELECT u.id,u.name,u.email,COUNT(o.id) AS order_count,SUM(o.amount) AS total_spent FROM users u LEFT JOIN orders o ON u.id=o.user_id WHERE u.active=1 AND u.created_at>\'2024-01-01\' GROUP BY u.id,u.name,u.email HAVING COUNT(o.id)>0 ORDER BY total_spent DESC LIMIT 10;',
    xml: '<?xml version="1.0" encoding="UTF-8"?><catalog><book id="1"><title>The Great Gatsby</title><author>F. Scott Fitzgerald</author><year>1925</year><price>9.99</price></book><book id="2"><title>1984</title><author>George Orwell</author><year>1949</year><price>7.99</price></book></catalog>'
  };

  /* ---- Indent size ---- */
  function getIndent() {
    var v = (indentSelect || {}).value || '2';
    if (v === 'tab') return '\t';
    return ' '.repeat(parseInt(v) || 2);
  }

  /* ---- Formatters ---- */
  function formatJSON(code) {
    var obj = JSON.parse(code);
    return JSON.stringify(obj, null, getIndent());
  }

  function minifyJSON(code) {
    var obj = JSON.parse(code);
    return JSON.stringify(obj);
  }

  function formatHTML(code) {
    var indent = getIndent();
    var VOID = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
    var level = 0;
    var result = [];

    code = code.trim();
    var parts = code.split(/(<[^>]+>)/g);

    parts.forEach(function(part) {
      var trimmed = part.trim();
      if (!trimmed) return;

      if (/^<\//.test(trimmed)) {
        level = Math.max(0, level - 1);
        result.push(indent.repeat(level) + trimmed);
      } else if (/^</.test(trimmed)) {
        var tagName = (trimmed.match(/^<([a-z]+)/i) || [])[1] || '';
        result.push(indent.repeat(level) + trimmed);
        if (!VOID.test(tagName) && !/\/>$/.test(trimmed) && !/^<!--/.test(trimmed)) {
          level++;
        }
      } else {
        result.push(indent.repeat(level) + trimmed);
      }
    });

    return result.join('\n');
  }

  function minifyHTML(code) {
    return code.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
  }

  function formatCSS(code) {
    var indent = getIndent();
    var result = '';
    var level = 0;
    var i = 0;
    while (i < code.length) {
      var ch = code[i];
      if (ch === '{') {
        result += ' {\n';
        level++;
        result += indent.repeat(level);
        i++;
      } else if (ch === '}') {
        result = result.trimEnd() + '\n';
        level = Math.max(0, level - 1);
        result += indent.repeat(level) + '}\n\n';
        i++;
      } else if (ch === ';') {
        result += ';\n' + indent.repeat(level);
        i++;
      } else if (ch === ':') {
        result += ': ';
        i++;
      } else {
        result += ch;
        i++;
      }
    }
    return result.trim();
  }

  function minifyCSS(code) {
    return code.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\s*([{}:;,])\s*/g,'$1').replace(/\s+/g,' ').trim();
  }

  function formatSQL(code) {
    var keywords = ['SELECT','FROM','WHERE','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','ON','GROUP BY','ORDER BY','HAVING','LIMIT','OFFSET','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','CREATE TABLE','DROP TABLE','ALTER TABLE','INDEX','UNION','AND','OR','NOT','IN','IS NULL','IS NOT NULL','BETWEEN','LIKE','AS','DISTINCT'];
    var result = code.trim();
    keywords.forEach(function(kw) {
      var re = new RegExp('\\b' + kw + '\\b', 'gi');
      result = result.replace(re, '\n' + kw);
    });
    return result.replace(/^\n/, '').split('\n').map(function(line) { return line.trim(); }).filter(Boolean).join('\n');
  }

  function formatXML(code) {
    var indent = getIndent();
    var result = '';
    var level = 0;
    var parts = code.split(/(<[^>]+>)/g);
    parts.forEach(function(part) {
      var trimmed = part.trim();
      if (!trimmed) return;
      if (/^<\//.test(trimmed)) {
        level = Math.max(0, level - 1);
        result += indent.repeat(level) + trimmed + '\n';
      } else if (/^</.test(trimmed) && !/\/>$/.test(trimmed) && !/^<!/.test(trimmed) && !/^<\?/.test(trimmed)) {
        result += indent.repeat(level) + trimmed + '\n';
        level++;
      } else {
        result += indent.repeat(level) + trimmed + '\n';
      }
    });
    return result.trim();
  }

  function formatJS(code) {
    var indent = getIndent();
    var result = '';
    var level = 0;
    var lines = code.split('\n');
    lines.forEach(function(line) {
      var trimmed = line.trim();
      if (!trimmed) { result += '\n'; return; }
      var closings = (trimmed.match(/[}\]]/g) || []).length;
      var openings = (trimmed.match(/[{[]/g) || []).length;
      if (closings > openings) level = Math.max(0, level - (closings - openings));
      result += indent.repeat(level) + trimmed + '\n';
      if (openings > closings) level += (openings - closings);
    });
    return result.trim();
  }

  /* ---- Format / Minify ---- */
  function doFormat(minify) {
    var code = inputTA.value;
    if (!code.trim()) { showError('No code to format.'); return; }
    hideError();

    var result;
    try {
      switch (currentLang) {
        case 'json':       result = minify ? minifyJSON(code) : formatJSON(code); break;
        case 'javascript': result = formatJS(code); break;
        case 'html':       result = minify ? minifyHTML(code) : formatHTML(code); break;
        case 'css':        result = minify ? minifyCSS(code) : formatCSS(code); break;
        case 'sql':        result = formatSQL(code); break;
        case 'xml':        result = formatXML(code); break;
        default:           result = code;
      }

      outputTA.value = result;
      setStatus('Formatted successfully', 'ok');
      if (copyBtn) copyBtn.removeAttribute('disabled');
      if (copyOutBtn) copyOutBtn.removeAttribute('disabled');
      if (downloadBtn) downloadBtn.removeAttribute('disabled');
    } catch (e) {
      showError('Error: ' + e.message);
      setStatus('Formatting failed', 'error');
    }
  }

  /* ---- Status ---- */
  function setStatus(text, type) {
    if (statusText) statusText.textContent = text;
    if (statusDot) {
      statusDot.className = 'cf-status-dot cf-status-' + (type || 'idle');
    }
  }

  function showError(msg) {
    if (errorPanel) errorPanel.classList.remove('cf-error-hidden');
    if (errorText)  errorText.textContent = msg;
  }

  function hideError() {
    if (errorPanel) errorPanel.classList.add('cf-error-hidden');
  }

  /* ---- Events ---- */
  if (langSelect) {
    langSelect.addEventListener('change', function() { currentLang = this.value; setStatus('Select language and format', 'idle'); });
    currentLang = langSelect.value;
  }

  if (formatBtn) formatBtn.addEventListener('click', function() { doFormat(false); });
  if (minifyBtn) minifyBtn.addEventListener('click', function() { doFormat(true); });

  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      inputTA.value = '';
      outputTA.value = '';
      hideError();
      setStatus('Select a language and paste your code to format it', 'idle');
      if (copyBtn) copyBtn.setAttribute('disabled', '');
      if (copyOutBtn) copyOutBtn.setAttribute('disabled', '');
      if (downloadBtn) downloadBtn.setAttribute('disabled', '');
    });
  }

  if (pasteBtn) {
    pasteBtn.addEventListener('click', function() {
      if (navigator.clipboard) {
        navigator.clipboard.readText().then(function(text) { inputTA.value = text; }).catch(function(){});
      }
    });
  }

  if (sampleBtn) {
    sampleBtn.addEventListener('click', function() {
      inputTA.value = SAMPLES[currentLang] || SAMPLES.json;
      setStatus('Sample loaded — click Format', 'idle');
    });
  }

  function copyText(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function() {
        if (toast) {
          toast.classList.add('cp-toast-visible');
          setTimeout(function() { toast.classList.remove('cp-toast-visible'); }, 1800);
        }
      });
    }
  }

  if (copyBtn) copyBtn.addEventListener('click', function() { copyText(outputTA.value); });
  if (copyOutBtn) copyOutBtn.addEventListener('click', function() { copyText(outputTA.value); });

  if (downloadBtn) {
    downloadBtn.addEventListener('click', function() {
      var ext = currentLang === 'javascript' ? 'js' : currentLang;
      var mime = currentLang === 'json' ? 'application/json' : 'text/plain';
      var blob = new Blob([outputTA.value], { type: mime });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'formatted.' + ext;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  /* ---- Keyboard shortcut: Ctrl+Enter ---- */
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); doFormat(false); }
    if (e.ctrlKey && e.shiftKey && e.key === 'C') { e.preventDefault(); copyText(outputTA.value); }
  });

  /* ---- Resizable panels ---- */
  if (resizeHandle) {
    var panels = document.getElementById('cf-panels');
    var dragging = false;

    resizeHandle.addEventListener('mousedown', function() { dragging = true; });
    document.addEventListener('mouseup', function() { dragging = false; });
    document.addEventListener('mousemove', function(e) {
      if (!dragging || !panels) return;
      var rect = panels.getBoundingClientRect();
      var pct = Math.min(80, Math.max(20, ((e.clientX - rect.left) / rect.width) * 100));
      var children = panels.querySelectorAll('.cf-panel');
      if (children[0]) children[0].style.flex = '0 0 ' + pct + '%';
      if (children[1]) children[1].style.flex = '1';
    });
  }

})();
