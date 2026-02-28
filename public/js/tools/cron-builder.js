/* ==========================================================================
   CRON BUILDER v1 — public/js/tools/cron-builder.js
   Value.Codes | All cron logic runs 100% client-side.
   ========================================================================== */

(function () {
  'use strict';

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  /* ---- DOM ---- */
  var exprInput    = document.getElementById('cron-expr');
  var descEl       = document.getElementById('cron-desc');
  var errorEl      = document.getElementById('cron-error');
  var copyBtn      = document.getElementById('cron-copy-btn');
  var nextList     = document.getElementById('cron-next-list');
  var tabVisual    = document.getElementById('tab-visual');
  var tabPresets   = document.getElementById('tab-presets');
  var panelVisual  = document.getElementById('panel-visual');
  var panelPresets = document.getElementById('panel-presets');

  if (!exprInput) return;

  /* ---- Tabs ---- */
  function switchTab(tab) {
    tabVisual.classList.toggle('cron-tab-active', tab === 'visual');
    tabPresets.classList.toggle('cron-tab-active', tab === 'presets');
    tabVisual.setAttribute('aria-selected', tab === 'visual');
    tabPresets.setAttribute('aria-selected', tab === 'presets');
    panelVisual.classList.toggle('cron-panel-hidden', tab !== 'visual');
    panelPresets.classList.toggle('cron-panel-hidden', tab !== 'presets');
  }
  if (tabVisual) tabVisual.addEventListener('click', function() { switchTab('visual'); });
  if (tabPresets) tabPresets.addEventListener('click', function() { switchTab('presets'); });

  /* ---- Preset buttons ---- */
  document.querySelectorAll('.cron-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var expr = btn.getAttribute('data-cron');
      if (exprInput) exprInput.value = expr;
      onExprChange();
      switchTab('visual');
    });
  });

  /* ---- Field dropdowns ---- */
  function initFieldToggle(typeId, inputId) {
    var typeEl  = document.getElementById(typeId);
    var inputEl = document.getElementById(inputId);
    if (!typeEl || !inputEl) return;
    typeEl.addEventListener('change', function() {
      var show = (this.value !== 'every') && (this.value !== 'weekdays') && (this.value !== 'weekends') && (this.value !== 'last');
      inputEl.classList.toggle('cron-field-hidden', !show);
      buildExprFromFields();
    });
  }

  initFieldToggle('cron-minute-type', 'cron-minute-input');
  initFieldToggle('cron-hour-type',   'cron-hour-input');
  initFieldToggle('cron-dom-type',    'cron-dom-input');
  initFieldToggle('cron-month-type',  'cron-month-input');
  initFieldToggle('cron-dow-type',    'cron-dow-input');

  /* Listen for value changes */
  ['cron-minute-val','cron-hour-val','cron-dom-val'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', buildExprFromFields);
  });
  var monthSel = document.getElementById('cron-month-val');
  if (monthSel) monthSel.addEventListener('change', buildExprFromFields);
  var dowGroup = document.querySelector('.cron-dow-checkboxes');
  if (dowGroup) dowGroup.addEventListener('change', buildExprFromFields);

  /* ---- Build expression from visual builder ---- */
  function fieldValue(typeId, valId, everyN) {
    var typeEl = document.getElementById(typeId);
    if (!typeEl) return '*';
    switch (typeEl.value) {
      case 'every': return '*';
      case 'specific': {
        var v = (document.getElementById(valId) || {}).value || '';
        return v.trim() || '*';
      }
      case 'range': {
        var v2 = (document.getElementById(valId) || {}).value || '';
        return v2.trim() || '*';
      }
      case 'every-n': {
        var v3 = (document.getElementById(valId) || {}).value || '5';
        return '*/' + (parseInt(v3) || 5);
      }
      case 'weekdays': return '1-5';
      case 'weekends': return '0,6';
      case 'last':     return 'L';
      default:         return '*';
    }
  }

  function buildExprFromFields() {
    var min = fieldValue('cron-minute-type', 'cron-minute-val');
    var hr  = fieldValue('cron-hour-type',   'cron-hour-val');
    var dom = fieldValue('cron-dom-type',     'cron-dom-val');

    /* Month */
    var monthType = (document.getElementById('cron-month-type') || {}).value || 'every';
    var mon = '*';
    if (monthType === 'specific' && monthSel) {
      var selected = Array.from(monthSel.selectedOptions).map(function(o) { return o.value; });
      mon = selected.length ? selected.join(',') : '*';
    }

    /* Day of week */
    var dowType = (document.getElementById('cron-dow-type') || {}).value || 'every';
    var dow = '*';
    if (dowType === 'specific' && dowGroup) {
      var checked = Array.from(dowGroup.querySelectorAll('input:checked')).map(function(i) { return i.value; });
      dow = checked.length ? checked.join(',') : '*';
    } else if (dowType === 'weekdays') { dow = '1-5'; }
    else if (dowType === 'weekends')  { dow = '0,6'; }

    var expr = [min, hr, dom, mon, dow].join(' ');
    if (exprInput) exprInput.value = expr;
    onExprChange(false);
  }

  /* ---- Expression change ---- */
  function onExprChange(fromInput) {
    if (fromInput === undefined) fromInput = true;
    var expr = (exprInput || {}).value || '';
    var parts = expr.trim().split(/\s+/);
    if (parts.length !== 5) {
      showError('Invalid cron expression. Must have exactly 5 fields.');
      return;
    }
    hideError();
    if (descEl) descEl.textContent = describeCron(parts);
    renderNextTimes(parts);
  }

  if (exprInput) exprInput.addEventListener('input', function() { onExprChange(true); });

  /* ---- Human-readable description ---- */
  function describeCron(parts) {
    var min = parts[0], hr = parts[1], dom = parts[2], mon = parts[3], dow = parts[4];
    if (min === '*' && hr === '*' && dom === '*' && mon === '*' && dow === '*') return 'Every minute';
    if (min === '0' && hr === '*') return 'At the start of every hour';
    if (min === '0' && hr === '0' && dom === '*' && mon === '*' && dow === '*') return 'Every day at midnight';
    if (min === '0' && dom === '*' && mon === '*' && dow === '*') return 'Every day at ' + formatHour(hr);
    if (min === '0' && dom === '*' && mon === '*') return 'Every ' + describeDow(dow) + ' at ' + formatHour(hr);
    if (min === '0' && hr === '0' && dow === '*') return 'Monthly on day ' + dom + ' at midnight';
    if (min.startsWith('*/')) return 'Every ' + min.slice(2) + ' minute' + (min.slice(2) !== '1' ? 's' : '');
    if (hr.startsWith('*/')) return 'Every ' + hr.slice(2) + ' hour' + (hr.slice(2) !== '1' ? 's' : '');
    return 'At ' + min + ' min past ' + formatHour(hr) + (dom !== '*' ? ', day ' + dom : '') + (mon !== '*' ? ' in ' + describeMon(mon) : '') + (dow !== '*' ? ' on ' + describeDow(dow) : '');
  }

  function formatHour(h) {
    if (h === '*') return 'every hour';
    var n = parseInt(h);
    if (isNaN(n)) return h;
    return (n % 12 || 12) + (n < 12 ? ' AM' : ' PM');
  }

  function describeDow(dow) {
    if (dow === '*') return 'every day';
    if (dow === '1-5') return 'weekdays';
    if (dow === '0,6') return 'weekends';
    return dow.split(',').map(function(d) { return DAYS[parseInt(d)] || d; }).join(', ');
  }

  function describeMon(mon) {
    if (mon === '*') return 'every month';
    return mon.split(',').map(function(m) { return MONTHS[parseInt(m) - 1] || m; }).join(', ');
  }

  /* ---- Next execution times ---- */
  function renderNextTimes(parts) {
    if (!nextList) return;
    var times = getNextTimes(parts, 5);
    nextList.innerHTML = '';
    if (!times.length) {
      nextList.textContent = 'Unable to compute next times for this expression.';
      return;
    }
    times.forEach(function(t, i) {
      var div = document.createElement('div');
      div.className = 'cron-next-item';
      var num = document.createElement('span');
      num.className = 'cron-next-num';
      num.textContent = '#' + (i + 1);
      var time = document.createElement('span');
      time.className = 'cron-next-time';
      time.textContent = t.toLocaleString();
      var rel = document.createElement('span');
      rel.className = 'cron-next-rel';
      rel.textContent = timeAgo(t);
      div.appendChild(num);
      div.appendChild(time);
      div.appendChild(rel);
      nextList.appendChild(div);
    });
  }

  function getNextTimes(parts, count) {
    var results = [];
    var now = new Date();
    var d = new Date(now);
    d.setSeconds(0);
    d.setMilliseconds(0);
    d.setMinutes(d.getMinutes() + 1);

    var limit = 50000;
    while (results.length < count && limit-- > 0) {
      if (matchesCron(parts, d)) results.push(new Date(d));
      d.setMinutes(d.getMinutes() + 1);
    }
    return results;
  }

  function matchesCron(parts, d) {
    return matchField(parts[0], d.getMinutes(), 0, 59) &&
           matchField(parts[1], d.getHours(), 0, 23) &&
           matchField(parts[2], d.getDate(), 1, 31) &&
           matchField(parts[3], d.getMonth() + 1, 1, 12) &&
           matchField(parts[4], d.getDay(), 0, 6);
  }

  function matchField(expr, val, min, max) {
    if (expr === '*') return true;
    if (expr === 'L') return val === max;
    var parts = expr.split(',');
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (p.indexOf('/') !== -1) {
        var sp = p.split('/');
        var start = sp[0] === '*' ? min : parseInt(sp[0]);
        var step  = parseInt(sp[1]);
        if (!isNaN(step) && val >= start && (val - start) % step === 0) return true;
      } else if (p.indexOf('-') !== -1) {
        var rng = p.split('-');
        if (val >= parseInt(rng[0]) && val <= parseInt(rng[1])) return true;
      } else if (parseInt(p) === val) {
        return true;
      }
    }
    return false;
  }

  function timeAgo(date) {
    var ms = date - new Date();
    var s = Math.round(ms / 1000);
    if (s < 60)   return 'in ' + s + 's';
    if (s < 3600) return 'in ' + Math.round(s / 60) + 'm';
    if (s < 86400) return 'in ' + Math.round(s / 3600) + 'h';
    return 'in ' + Math.round(s / 86400) + 'd';
  }

  /* ---- Error display ---- */
  function showError(msg) {
    if (errorEl) { errorEl.textContent = msg; errorEl.classList.remove('cron-expr-error-hidden'); }
    if (descEl)  descEl.textContent = '';
    if (nextList) nextList.innerHTML = '';
  }
  function hideError() {
    if (errorEl) errorEl.classList.add('cron-expr-error-hidden');
  }

  /* ---- Copy ---- */
  if (copyBtn) {
    copyBtn.addEventListener('click', function() {
      if (exprInput && navigator.clipboard) {
        navigator.clipboard.writeText(exprInput.value).then(function() {
          copyBtn.textContent = 'Copied!';
          setTimeout(function() { copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy'; }, 2000);
        });
      }
    });
  }

  /* ---- Init ---- */
  onExprChange(true);

})();
