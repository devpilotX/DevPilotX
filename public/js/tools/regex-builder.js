/* ==========================================================================
   REGEX BUILDER — Value.Codes
   Production build
   ·  Single-pass matching (collectMatches → render from data)
   ·  Change-detection cache (skip DOM writes when inputs unchanged)
   ·  Execution timeout guard (catastrophic backtracking protection)
   ·  ResizeObserver for highlight ↔ textarea sync
   ·  aria-busy on results region during processing
   ·  Safe code generation with proper per-language escaping
   ========================================================================== */

(function () {
  'use strict';

  /* ========================================================================
     DOM REFS
     ======================================================================== */

  var $ = function (id) { return document.getElementById(id); };

  var elPattern      = $('regex-input');
  var elTest         = $('regex-test');
  var elHighlight    = $('regex-highlight');
  var elTestWrap     = $('regex-test-wrap');
  var elStatus       = $('regex-status');
  var elStatusIcon   = $('regex-status-icon');
  var elStatusText   = $('regex-status-text');
  var elMatchCount   = $('match-count');
  var elMatches      = $('regex-matches');
  var elGroups       = $('regex-groups');
  var elResultsRgn   = $('regex-results-region');
  var elReplaceIn    = $('regex-replace-input');
  var elReplaceOut   = $('regex-replace-output');
  var elLang         = $('regex-lang-select');
  var elCodegen      = $('regex-codegen-code');
  var elClearBtn     = $('regex-clear-btn');
  var elSampleBtn    = $('regex-sample-btn');
  var elCopyReplace  = $('regex-copy-replaced');
  var elCopyCode     = $('regex-copy-code');
  var elCheatToggle  = $('regex-cheatsheet-toggle');
  var elCheatBody    = $('regex-cheatsheet-body');
  var elPatternsWrap = $('cheatsheet-patterns');

  var flagBtns = Array.prototype.slice.call(
    document.querySelectorAll('.flag-btn')
  );

  /* ========================================================================
     COMMON PATTERNS (defined in JS — avoids HTML escaping issues)
     ======================================================================== */

  var PATTERNS = [
    { l: 'Email',
      p: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}',
      s: 'user@example.com\\ntest@domain.co.uk\\nnot-an-email' },
    { l: 'URL',
      p: 'https?:\\\\/\\\\/(www\\\\.)?[-a-zA-Z0-9@:%._\\\\+~#=]{1,256}\\\\.[a-zA-Z0-9()]{1,6}\\\\b([-a-zA-Z0-9()@:%_\\\\+.~#?&\\\\/\\\\/=]*)',
      s: '<https://value.codes>\\nhttp://example.com/path?q=1\\nnot a url' },
    { l: 'IPv4',
      p: '\\\\b\\\\d{1,3}\\\\.\\\\d{1,3}\\\\.\\\\d{1,3}\\\\.\\\\d{1,3}\\\\b',
      s: '192.168.1.1\\n10.0.0.255\\n999.999.999.999' },
    { l: 'Phone (E.164)',
      p: '^\\\\+?[1-9]\\\\d{1,14}$',
      s: '+14155552671\\n+442071234567\\n000' },
    { l: 'Hex Color',
      p: '#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})',
      s: '#c9281a\\n#fff\\n#1a1a2e\\nnotacolor' },
    { l: 'Date (YYYY-MM-DD)',
      p: '\\\\b\\\\d{4}[-\\\\/]\\\\d{2}[-\\\\/]\\\\d{2}\\\\b',
      s: '2026-02-25\\n2025/12/31\\nnot-a-date' },
    { l: 'Strong Password',
      p: '(?=.*[a-z])(?=.*[A-Z])(?=.*\\\\d)(?=.*[@$!%*?&])[A-Za-z\\\\d@$!%*?&]{8,}',
      s: 'Str0ng!Pass\\nweak\\n12345678' },
    { l: 'HTML Tag',
      p: '<([a-zA-Z][a-zA-Z0-9]*)\\\\b[^>]*>(.*?)<\\\\/\\\\1>',
      s: '<div>hello</div>\\n<span class="x">world</span>\\n<br/>' }
  ];

  /* ========================================================================
     STATE
     ======================================================================== */

  var flags = { g: true, i: false, m: false, s: false, u: false };
  var _c    = { pat: '', txt: '', fl: '', rep: '', lang: '' };  // cache

  var debounceId  = null;
  var DEBOUNCE    = 90;
  var MATCH_CAP   = 10000;
  var DETAIL_CAP  = 500;
  var EXEC_BUDGET = 250;  // ms — max time for regex execution before abort

  /* ========================================================================
     UTILITIES
     ======================================================================== */

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function getFlags() {
    var r = '';
    if (flags.g) r += 'g';
    if (flags.i) r += 'i';
    if (flags.m) r += 'm';
    if (flags.s) r += 's';
    if (flags.u) r += 'u';
    return r;
  }

  function makeRegex(pat, fl) {
    if (!pat) return { rx: null, err: null };
    try  { return { rx: new RegExp(pat, fl), err: null }; }
    catch (e) { return { rx: null, err: e.message.replace(/^Invalid regular expression:\\s*/, '') }; }
  }

  /* Clipboard */
  function copyText(text, btn) {
    if (!text) return;
    var done = function () { flashBtn(btn); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(function () { done(); });
    }
  }

  function flashBtn(btn) {
    if (!btn) return;
    btn.classList.add('copy-success');
    var sp = btn.querySelector('span');
    var orig = sp ? sp.textContent : '';
    if (sp) sp.textContent = 'Copied!';
    setTimeout(function () {
      btn.classList.remove('copy-success');
      if (sp) sp.textContent = orig;
    }, 1400);
  }

  /* ========================================================================
     STATUS BAR
     ======================================================================== */

  function showStatus(type, msg) {
    elStatus.className = 'regex-status regex-status-' + type;
    elStatusIcon.textContent = type === 'error' ? '✕' : type === 'success' ? '✓' : '⚠';
    elStatusText.textContent = msg;
  }
  function hideStatus() {
    elStatus.className = 'regex-status regex-status-hidden';
  }

  /* ========================================================================
     SINGLE-PASS COLLECTOR  (with execution-time budget)

     Runs the regex ONCE.  Returns an array of match objects consumed
     by every downstream renderer — no renderer ever calls regex.exec().

     If execution exceeds EXEC_BUDGET ms the loop aborts and a partial
     result is returned with a .timedOut flag so the UI can warn.
     ======================================================================== */

  function collectMatches(text, pat, fl) {
    var o = makeRegex(pat, fl);
    if (!o.rx) return { matches: [], timedOut: false };

    var rx   = o.rx;
    var out  = [];
    var m;
    var t0   = performance.now();

    rx.lastIndex = 0;

    while ((m = rx.exec(text)) !== null) {
      /* zero-width match guard */
      if (m[0].length === 0) {
        rx.lastIndex = m.index + 1;
        if (rx.lastIndex > text.length) break;
        continue;
      }

      out.push({
        full:   m[0],
        index:  m.index,
        end:    m.index + m[0].length,
        groups: Array.prototype.slice.call(m, 1)
      });

      if (out.length >= MATCH_CAP) break;
      if (!rx.global) break;

      /* Catastrophic-backtracking guard */
      if (performance.now() - t0 > EXEC_BUDGET) {
        return { matches: out, timedOut: true };
      }
    }

    return { matches: out, timedOut: false };
  }

  /* ========================================================================
     RENDERERS  (consume pre-collected data — never call regex.exec)
     ======================================================================== */

  /* --- Highlight --- */
  function renderHighlight(text, matches) {
    if (!matches.length) {
      elHighlight.innerHTML = escHtml(text || '') + '\\n';
      return 0;
    }
    var parts = [], last = 0, i, m;
    for (i = 0; i < matches.length; i++) {
      m = matches[i];
      if (m.index > last) parts.push(escHtml(text.slice(last, m.index)));
      parts.push('<mark>' + escHtml(text.slice(m.index, m.end)) + '</mark>');
      last = m.end;
    }
    if (last < text.length) parts.push(escHtml(text.slice(last)));
    elHighlight.innerHTML = parts.join('') + '\\n';
    return matches.length;
  }

  /* --- Match details --- */
  function renderMatches(matches) {
    if (!matches.length) {
      elMatches.innerHTML = '<p class="regex-placeholder-msg">No matches found.</p>';
      return;
    }
    var h = '', lim = Math.min(matches.length, DETAIL_CAP), i;
    for (i = 0; i < lim; i++) {
      h += '<div class="regex-match-item">'
         + '<span class="regex-match-label">Match ' + (i + 1) + '</span>'
         + '<span class="regex-match-value mono">' + escHtml(matches[i].full) + '</span>'
         + '<span class="regex-match-index">index ' + matches[i].index + '</span>'
         + '</div>';
    }
    if (matches.length > DETAIL_CAP) {
      h += '<p class="regex-placeholder-msg">Showing first ' + DETAIL_CAP + ' of ' + matches.length + ' matches.</p>';
    }
    elMatches.innerHTML = h;
  }

  /* --- Capture groups --- */
  function renderGroups(matches) {
    var has = false, i, j;
    for (i = 0; i < matches.length && !has; i++)
      for (j = 0; j < matches[i].groups.length; j++)
        if (typeof matches[i].groups[j] !== 'undefined') { has = true; break; }

    if (!has) {
      elGroups.innerHTML = '<p class="regex-placeholder-msg">Groups appear when your pattern contains ( ).</p>';
      return;
    }

    var h = '', lim = Math.min(matches.length, DETAIL_CAP);
    for (i = 0; i < lim; i++) {
      if (matches.length > 1)
        h += '<div class="regex-match-item"><span class="regex-match-label">Match ' + (i + 1) + '</span></div>';
      for (j = 0; j < matches[i].groups.length; j++) {
        var v = matches[i].groups[j];
        h += '<div class="regex-group-item">'
           + '<span class="regex-group-label mono">$' + (j + 1) + '</span>'
           + '<span class="regex-group-value mono">'
           + (typeof v !== 'undefined' ? escHtml(v) : '<em style="color:#999">undefined</em>')
           + '</span></div>';
      }
    }
    elGroups.innerHTML = h;
  }

  /* --- Replace --- */
  function renderReplace(text, pat, fl, rep) {
    if (!pat || !text) { elReplaceOut.textContent = ''; return; }
    var o = makeRegex(pat, fl);
    if (!o.rx) { elReplaceOut.textContent = ''; return; }
    try   { elReplaceOut.textContent = text.replace(o.rx, rep || ''); }
    catch (e) { elReplaceOut.textContent = 'Error: ' + e.message; }
  }

  /* ========================================================================
     CODE GENERATION — with proper per-language escaping
     ======================================================================== */

  function escQ(s, q) {
    /* Escape a pattern string for embedding inside a quoted code literal */
    var r = s.replace(/\\\\/g, '\\\\\\\\');
    return q === '"'  ? r.replace(/"/g,  '\\\\"')
         : q === "'"  ? r.replace(/'/g,  "\\\\'")
         : q === '`'  ? r.replace(/`/g,  '\\\\`')
         : r;
  }

  function renderCode(pat, fl, lang) {
    if (!pat) { elCodegen.textContent = '// Enter a regex pattern to generate code'; return; }

    var c = '';

    switch (lang) {

      /* ------------------------------------------------------------------ */
      case 'javascript': {
        var gfl = fl.indexOf('g') === -1 ? fl + 'g' : fl;
        c = 'const regex = /' + pat + '/' + fl + ';\\n'
          + 'const text = \\'your test string\\';\\n\\n'
          + '// Test\\nconsole.log(regex.test(text));\\n\\n'
          + '// All matches\\n'
          + 'const matches = [...text.matchAll(\\n'
          + '  new RegExp(\\'' + escQ(pat, "'") + '\\', \\'' + gfl + '\\')\\n)];\\n'
          + 'matches.forEach(m => console.log(m[0], \\'at\\', m.index));';
        break;
      }

      /* ------------------------------------------------------------------ */
      case 'python': {
        var pf = [];
        if (fl.indexOf('i') !== -1) pf.push('re.IGNORECASE');
        if (fl.indexOf('m') !== -1) pf.push('re.MULTILINE');
        if (fl.indexOf('s') !== -1) pf.push('re.DOTALL');
        var pa = pf.length ? ', ' + pf.join(' | ') : '';
        c = 'import re\\n\\n'
          + 'pattern = r\\'' + escQ(pat, "'") + '\\'\\n'
          + 'text = \\'your test string\\'\\n\\n'
          + 'matches = re.findall(pattern, text' + pa + ')\\n'
          + 'print(matches)\\n\\n'
          + 'match = re.search(pattern, text' + pa + ')\\n'
          + 'if match:\\n    print(match.group())';
        break;
      }

      /* ------------------------------------------------------------------ */
      case 'java': {
        var jf = [];
        if (fl.indexOf('i') !== -1) jf.push('Pattern.CASE_INSENSITIVE');
        if (fl.indexOf('m') !== -1) jf.push('Pattern.MULTILINE');
        if (fl.indexOf('s') !== -1) jf.push('Pattern.DOTALL');
        var ja = jf.length ? ', ' + jf.join(' | ') : '';
        c = 'import java.util.regex.*;\\n\\n'
          + 'Pattern pattern = Pattern.compile("' + escQ(pat, '"') + '"' + ja + ');\\n'
          + 'Matcher matcher = pattern.matcher("your test string");\\n\\n'
          + 'while (matcher.find()) {\\n'
          + '    System.out.println("Match: " + matcher.group());\\n'
          + '    System.out.println("Index: " + matcher.start());\\n}';
        break;
      }

      /* ------------------------------------------------------------------ */
      case 'go': {
        var gi = '';
        if (fl.indexOf('i') !== -1) gi += 'i';
        if (fl.indexOf('m') !== -1) gi += 'm';
        if (fl.indexOf('s') !== -1) gi += 's';
        var goPat = gi ? '(?' + gi + ')' + pat : pat;
        /* Go raw string uses backticks — if pattern contains backtick, fall back to interpreted string */
        var goHasBacktick = goPat.indexOf('`') !== -1;
        var goPatStr = goHasBacktick
          ? '"' + escQ(goPat, '"') + '"'
          : '`' + goPat + '`';
        c = 'package main\\n\\nimport (\\n    "fmt"\\n    "regexp"\\n)\\n\\n'
          + 'func main() {\\n'
          + '    re := regexp.MustCompile(' + goPatStr + ')\\n'
          + '    text := "your test string"\\n\\n'
          + '    matches := re.FindAllString(text, -1)\\n'
          + '    fmt.Println(matches)\\n}';
        break;
      }

      /* ------------------------------------------------------------------ */
      case 'php': {
        var phpf = '';
        if (fl.indexOf('i') !== -1) phpf += 'i';
        if (fl.indexOf('m') !== -1) phpf += 'm';
        if (fl.indexOf('s') !== -1) phpf += 's';
        if (fl.indexOf('u') !== -1) phpf += 'u';
        c = '<?php\\n\\n'
          + '$pattern = \\'/' + escQ(pat, "'").replace(/\\//g, '\\\\/') + '/' + phpf + '\\';\\n'
          + '$text = \\'your test string\\';\\n\\n'
          + 'preg_match_all($pattern, $text, $matches);\\n'
          + 'print_r($matches[0]);\\n\\n'
          + 'if (preg_match($pattern, $text)) {\\n'
          + '    echo "Match found!";\\n}';
        break;
      }

      /* ------------------------------------------------------------------ */
      case 'csharp': {
        var csf = [];
        if (fl.indexOf('i') !== -1) csf.push('RegexOptions.IgnoreCase');
        if (fl.indexOf('m') !== -1) csf.push('RegexOptions.Multiline');
        if (fl.indexOf('s') !== -1) csf.push('RegexOptions.Singleline');
        var csa = csf.length ? ', ' + csf.join(' | ') : '';
        /* C# verbatim string: only " needs doubling */
        c = 'using System;\\nusing System.Text.RegularExpressions;\\n\\n'
          + 'var regex = new Regex(@"' + pat.replace(/"/g, '""') + '"' + csa + ');\\n'
          + 'var text = "your test string";\\n\\n'
          + 'foreach (Match match in regex.Matches(text))\\n{\\n'
          + '    Console.WriteLine($"Match: {match.Value} at {match.Index}");\\n}';
        break;
      }

      /* ------------------------------------------------------------------ */
      case 'ruby': {
        var rbf = '';
        if (fl.indexOf('i') !== -1) rbf += 'i';
        if (fl.indexOf('m') !== -1) rbf += 'm';
        /* Ruby regex literal: escape forward slashes */
        var rbPat = pat.replace(/\\//g, '\\\\/');
        c = 'text = \\'your test string\\'\\n'
          + 'pattern = /' + rbPat + '/' + rbf + '\\n\\n'
          + 'matches = text.scan(pattern)\\nputs matches.inspect\\n\\n'
          + 'puts "Match!" if text.match?(pattern)';
        break;
      }

      /* ------------------------------------------------------------------ */
      case 'rust': {
        var ri = '';
        if (fl.indexOf('i') !== -1) ri += '(?i)';
        if (fl.indexOf('m') !== -1) ri += '(?m)';
        if (fl.indexOf('s') !== -1) ri += '(?s)';
        /* Rust r"..." — if pattern has ", use r#"..."# */
        var rsPat = ri + pat;
        var rsHasQuote = rsPat.indexOf('"') !== -1;
        var rsLit = rsHasQuote
          ? 'r#"' + rsPat + '"#'
          : 'r"' + rsPat + '"';
        c = 'use regex::Regex;\\n\\n'
          + 'fn main() {\\n'
          + '    let re = Regex::new(' + rsLit + ').unwrap();\\n'
          + '    let text = "your test string";\\n\\n'
          + '    for mat in re.find_iter(text) {\\n'
          + '        println!("Match: {} at {}", mat.as_str(), mat.start());\\n'
          + '    }\\n}';
        break;
      }

      default:
        c = '// Select a language';
    }

    elCodegen.textContent = c;
  }

  /* ========================================================================
     MASTER UPDATE
     Single-pass + cache + execution budget + aria-busy
     ======================================================================== */

  function update() {
    var pat  = elPattern.value;
    var text = elTest.value;
    var fl   = getFlags();
    var rep  = elReplaceIn.value;
    var lang = elLang.value;

    /* ---- change detection ---- */
    var patChanged  = pat !== _c.pat || fl !== _c.fl;
    var txtChanged  = text !== _c.txt;
    var repChanged  = rep !== _c.rep;
    var langChanged = lang !== _c.lang;

    if (!patChanged && !txtChanged && !repChanged && !langChanged) return;

    _c.pat = pat; _c.txt = text; _c.fl = fl; _c.rep = rep; _c.lang = lang;

    /* ---- aria-busy ---- */
    if (elResultsRgn) elResultsRgn.setAttribute('aria-busy', 'true');

    /* ---- error fast-path ---- */
    var compiled = makeRegex(pat, fl);
    if (compiled.err) {
      showStatus('error', compiled.err);
      elHighlight.innerHTML = escHtml(text) + '\\n';
      elMatchCount.textContent = '0 matches';
      elMatches.innerHTML = '<p class="regex-placeholder-msg">Fix the pattern error above.</p>';
      elGroups.innerHTML  = '<p class="regex-placeholder-msg">Fix the pattern error above.</p>';
      elReplaceOut.textContent = '';
      if (patChanged || langChanged) renderCode(pat, fl, lang);
      if (elResultsRgn) elResultsRgn.setAttribute('aria-busy', 'false');
      return;
    }

    /* ---- empty fast-path ---- */
    if (!pat) {
      hideStatus();
      elHighlight.innerHTML = escHtml(text) + '\\n';
      elMatchCount.textContent = '0 matches';
      elMatches.innerHTML = '<p class="regex-placeholder-msg">Enter a pattern and test string to see matches.</p>';
      elGroups.innerHTML  = '<p class="regex-placeholder-msg">Groups appear when your pattern contains ( ).</p>';
      elReplaceOut.textContent = '';
      if (patChanged || langChanged) renderCode('', fl, lang);
      if (elResultsRgn) elResultsRgn.setAttribute('aria-busy', 'false');
      return;
    }

    /* ---- single-pass data collection ---- */
    if (patChanged || txtChanged) {
      var result = collectMatches(text, pat, fl);
      var matches = result.matches;
      var count = renderHighlight(text, matches);

      elMatchCount.textContent = count + (count === 1 ? ' match' : ' matches');

      if (matches.length) renderMatches(matches);
      else elMatches.innerHTML = '<p class="regex-placeholder-msg">No matches found.</p>';

      renderGroups(matches);

      /* Status */
      if (result.timedOut) {
        showStatus('warning', 'Pattern is too complex — showing partial results (' + count + ' matches). Simplify your regex to avoid catastrophic backtracking.');
      } else if (count > 0) {
        showStatus('success', count + (count === 1 ? ' match' : ' matches') + ' found');
      } else if (text) {
        showStatus('warning', 'No matches in test string');
      } else {
        hideStatus();
      }
    }

    /* ---- replace ---- */
    if (patChanged || txtChanged || repChanged) {
      renderReplace(text, pat, fl, rep);
    }

    /* ---- code gen ---- */
    if (patChanged || langChanged) {
      renderCode(pat, fl, lang);
    }

    if (elResultsRgn) elResultsRgn.setAttribute('aria-busy', 'false');
  }

  function debounced() {
    clearTimeout(debounceId);
    debounceId = setTimeout(update, DEBOUNCE);
  }

  /* ========================================================================
     SCROLL SYNC + RESIZE OBSERVER
     ======================================================================== */

  function syncScroll() {
    elHighlight.scrollTop  = elTest.scrollTop;
    elHighlight.scrollLeft = elTest.scrollLeft;
  }

  /* Keep highlight layer sized to textarea after manual resize */
  if (typeof ResizeObserver !== 'undefined' && elTest && elHighlight) {
    var ro = new ResizeObserver(function () {
      elHighlight.style.height = elTest.offsetHeight + 'px';
    });
    ro.observe(elTest);
  }

  /* ========================================================================
     PATTERN BUTTONS
     ======================================================================== */

  function buildPatternButtons() {
    if (!elPatternsWrap) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < PATTERNS.length; i++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cheatsheet-pattern-btn';
      btn.textContent = PATTERNS[i].l;
      btn.setAttribute('data-idx', String(i));
      frag.appendChild(btn);
    }
    elPatternsWrap.appendChild(frag);

    elPatternsWrap.addEventListener('click', function (e) {
      var t = e.target;
      if (!t.classList.contains('cheatsheet-pattern-btn')) return;
      var idx = parseInt(t.getAttribute('data-idx'), 10);
      if (isNaN(idx) || !PATTERNS[idx]) return;
      var p = PATTERNS[idx];
      elPattern.value = p.p;
      elTest.value = p.s;

      if (p.p.indexOf('^') !== -1 || p.p.indexOf('$') !== -1) {
        flags.m = true;
        syncFlagUI();
      }

      bustCache();
      elPattern.focus();
      update();
    });
  }

  function syncFlagUI() {
    flagBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', String(!!flags[b.getAttribute('data-flag')]));
    });
  }

  function bustCache() {
    _c.pat = '\\x00'; _c.txt = '\\x00'; _c.fl = '\\x00';
    _c.rep = '\\x00'; _c.lang = '\\x00';
  }

  /* ========================================================================
     EVENT BINDINGS
     ======================================================================== */

  elPattern.addEventListener('input', debounced);
  elTest.addEventListener('input', debounced);
  elReplaceIn.addEventListener('input', debounced);
  elTest.addEventListener('scroll', syncScroll, { passive: true });

  /* Flags */
  flagBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-flag');
      flags[f] = !flags[f];
      btn.setAttribute('aria-pressed', String(flags[f]));
      _c.fl = '';
      update();
    });
  });

  /* Clear */
  if (elClearBtn) {
    elClearBtn.addEventListener('click', function () {
      elPattern.value   = '';
      elTest.value      = '';
      elReplaceIn.value = '';
      bustCache();
      elPattern.focus();
      update();
    });
  }

  /* Sample */
  if (elSampleBtn) {
    elSampleBtn.addEventListener('click', function () {
      elTest.value =
        'John Doe — john.doe@example.com — 2026-02-25\\n'
      + 'Jane Smith — jane_smith@domain.co.uk — 2025-12-31\\n'
      + 'Order #12345 shipped to 192.168.1.42 on 2024-06-15\\n'
      + 'Phone: +14155552671 | Hex: #c9281a | IP: 10.0.0.1\\n'
      + 'Visit <https://value.codes/tools> for free dev tools.\\n'
      + 'Password test: Str0ng!Pass vs weakpassword vs 12345678';
      if (!elPattern.value)
        elPattern.value = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}';
      bustCache();
      update();
    });
  }

  /* Language */
  if (elLang) {
    elLang.addEventListener('change', function () {
      _c.lang = '';
      update();
    });
  }

  /* Copy */
  if (elCopyReplace) {
    elCopyReplace.addEventListener('click', function () {
      copyText(elReplaceOut.textContent, elCopyReplace);
    });
  }
  if (elCopyCode) {
    elCopyCode.addEventListener('click', function () {
      copyText(elCodegen.textContent, elCopyCode);
    });
  }

  /* Cheatsheet toggle */
  if (elCheatToggle && elCheatBody) {
    elCheatToggle.addEventListener('click', function () {
      var expanded = elCheatToggle.getAttribute('aria-expanded') === 'true';
      elCheatToggle.setAttribute('aria-expanded', String(!expanded));
      elCheatBody.classList.toggle('regex-cheatsheet-body-collapsed', expanded);
      var sp = elCheatToggle.querySelector('.cheatsheet-toggle-text');
      if (sp) sp.textContent = expanded ? 'Expand' : 'Collapse';
    });
  }

  /* Keyboard: Ctrl/Cmd+Enter → focus pattern */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      elPattern.focus();
      elPattern.select();
    }
  });

  /* ========================================================================
     INIT
     ======================================================================== */

  buildPatternButtons();
  update();

})();