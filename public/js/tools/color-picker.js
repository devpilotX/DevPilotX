/* ==========================================================================
   COLOR PICKER v1 — public/js/tools/color-picker.js
   Value.Codes | All color operations run 100% client-side.
   ========================================================================== */

(function () {
  'use strict';

  var MAX_RECENT = 12;
  var recentColors = [];

  /* ---- DOM ---- */
  var canvas    = document.getElementById('cp-canvas');
  var cursor    = document.getElementById('cp-cursor');
  var hueSlider = document.getElementById('cp-hue');
  var alphaSlider = document.getElementById('cp-alpha');
  var native    = document.getElementById('cp-native');
  var preview   = document.getElementById('cp-preview');
  var previewHex = document.getElementById('cp-preview-hex');
  var hexIn     = document.getElementById('cp-hex');
  var rgbIn     = document.getElementById('cp-rgb');
  var hslIn     = document.getElementById('cp-hsl');
  var rgbaIn    = document.getElementById('cp-rgba');
  var hsbIn     = document.getElementById('cp-hsb');
  var palette   = document.getElementById('cp-palette');
  var recent    = document.getElementById('cp-recent');
  var toast     = document.getElementById('cp-toast');

  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var state = { h: 4, s: 87, b: 79, a: 100 };

  /* ---- Color math ---- */
  function hsbToRgb(h, s, b) {
    s /= 100; b /= 100;
    var k = function(n) { return (n + h / 60) % 6; };
    var f = function(n) { return b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1))); };
    return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var l = (max + min) / 2, s = 0, h = 0;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(function(v) { return v.toString(16).padStart(2, '0').toUpperCase(); }).join('');
  }

  function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(function(c) { return c + c; }).join('');
    var n = parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function luminance(r, g, b) {
    var vals = [r, g, b].map(function(v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2];
  }

  function contrastRatio(l1, l2) {
    var bright = Math.max(l1, l2), dark = Math.min(l1, l2);
    return ((bright + 0.05) / (dark + 0.05)).toFixed(2);
  }

  /* ---- Canvas drawing ---- */
  function drawCanvas() {
    var w = canvas.width, h = canvas.height;
    var hueStr = 'hsl(' + state.h + ',100%,50%)';
    var gradH = ctx.createLinearGradient(0, 0, w, 0);
    gradH.addColorStop(0, '#fff');
    gradH.addColorStop(1, hueStr);
    ctx.fillStyle = gradH;
    ctx.fillRect(0, 0, w, h);
    var gradV = ctx.createLinearGradient(0, 0, 0, h);
    gradV.addColorStop(0, 'rgba(0,0,0,0)');
    gradV.addColorStop(1, '#000');
    ctx.fillStyle = gradV;
    ctx.fillRect(0, 0, w, h);
  }

  function positionCursor() {
    var x = (state.s / 100) * canvas.width;
    var y = (1 - state.b / 100) * canvas.height;
    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';
  }

  /* ---- Update all outputs ---- */
  function updateOutputs() {
    var rgb = hsbToRgb(state.h, state.s, state.b);
    var hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    var a   = (state.a / 100).toFixed(2);

    var hexVal  = hex;
    var rgbVal  = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
    var hslVal  = 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)';
    var rgbaVal = 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + a + ')';
    var hsbVal  = 'hsb(' + state.h + '\u00b0, ' + state.s + '%, ' + state.b + '%)';

    if (hexIn)  hexIn.value  = hexVal;
    if (rgbIn)  rgbIn.value  = rgbVal;
    if (hslIn)  hslIn.value  = hslVal;
    if (rgbaIn) rgbaIn.value = rgbaVal;
    if (hsbIn)  hsbIn.value  = hsbVal;

    var swatchColor = rgbaVal;
    if (preview)    preview.style.background = swatchColor;
    if (previewHex) previewHex.textContent   = hexVal;
    if (native)     native.value             = hex;

    updateContrast(rgb.r, rgb.g, rgb.b);
    generatePalette(state.h, state.s, state.b);
  }

  /* ---- Contrast ---- */
  function updateContrast(r, g, b) {
    var lum = luminance(r, g, b);
    var ratioW = contrastRatio(lum, luminance(255, 255, 255));
    var ratioB = contrastRatio(lum, luminance(0, 0, 0));
    var rw = document.getElementById('cp-ratio-white');
    var rb = document.getElementById('cp-ratio-black');
    if (rw) rw.textContent = ratioW + ':1';
    if (rb) rb.textContent = ratioB + ':1';
    var cp = document.getElementById('cp-contrast-preview');
    if (cp) {
      cp.style.background = rgbToHex(r, g, b);
      var textDark = document.getElementById('cp-contrast-on-dark');
      var textLight = document.getElementById('cp-contrast-on-light');
      if (textDark)  textDark.style.color  = '#000';
      if (textLight) textLight.style.color = '#fff';
    }
  }

  /* ---- Palette ---- */
  function generatePalette(h, s, b) {
    if (!palette) return;
    palette.innerHTML = '';
    var swatches = [];
    for (var i = 1; i <= 9; i++) {
      swatches.push({ h: h, s: Math.round(s * (i / 9)), b: Math.round(100 - (100 - b) * (i / 9) + 10 * (i < 5 ? 1 : 0)) });
    }
    swatches.push({ h: (h + 180) % 360, s: s, b: b });
    swatches.push({ h: (h + 120) % 360, s: s, b: b });
    swatches.push({ h: (h + 240) % 360, s: s, b: b });

    swatches.forEach(function(sw) {
      var rgb = hsbToRgb(sw.h, Math.min(100, Math.max(0, sw.s)), Math.min(100, Math.max(0, sw.b)));
      var hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      var div = document.createElement('button');
      div.className = 'cp-palette-swatch';
      div.style.background = hex;
      div.setAttribute('title', hex);
      div.setAttribute('aria-label', 'Select color ' + hex);
      div.type = 'button';
      var label = document.createElement('span');
      label.textContent = hex.replace('#', '');
      div.appendChild(label);
      div.addEventListener('click', function() { applyHex(hex); });
      palette.appendChild(div);
    });
  }

  /* ---- Recent ---- */
  function addRecent(hex) {
    if (recentColors[0] === hex) return;
    recentColors = [hex].concat(recentColors.filter(function(c) { return c !== hex; })).slice(0, MAX_RECENT);
    renderRecent();
  }

  function renderRecent() {
    if (!recent) return;
    recent.innerHTML = '';
    recentColors.forEach(function(hex) {
      var btn = document.createElement('button');
      btn.className = 'cp-recent-swatch';
      btn.style.background = hex;
      btn.setAttribute('title', hex);
      btn.setAttribute('aria-label', 'Select recent color ' + hex);
      btn.type = 'button';
      btn.addEventListener('click', function() { applyHex(hex); });
      recent.appendChild(btn);
    });
  }

  /* ---- Apply a hex color ---- */
  function applyHex(hex) {
    var rgb = hexToRgb(hex);
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    state.h = hsl.h;
    state.s = hsl.s;
    state.b = Math.round((hsl.l + hsl.s * Math.min(hsl.l, 100 - hsl.l) / 100));
    if (hueSlider) hueSlider.value = state.h;
    drawCanvas();
    positionCursor();
    updateOutputs();
    addRecent(hex);
  }

  /* ---- Canvas interaction ---- */
  function canvasPick(e) {
    var rect = canvas.getBoundingClientRect();
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    var x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    var y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    state.s = Math.round(x * 100);
    state.b = Math.round((1 - y) * 100);
    cursor.style.left = (x * canvas.width) + 'px';
    cursor.style.top = (y * canvas.height) + 'px';
    updateOutputs();
  }

  var picking = false;
  canvas.addEventListener('mousedown', function(e) { picking = true; canvasPick(e); });
  canvas.addEventListener('touchstart', function(e) { e.preventDefault(); picking = true; canvasPick(e); }, { passive: false });
  document.addEventListener('mousemove', function(e) { if (picking) canvasPick(e); });
  document.addEventListener('touchmove', function(e) { if (picking) { e.preventDefault(); canvasPick(e); } }, { passive: false });
  document.addEventListener('mouseup', function() {
    if (picking) { picking = false; addRecent((hexIn || {}).value || '#000000'); }
  });
  document.addEventListener('touchend', function() {
    if (picking) { picking = false; addRecent((hexIn || {}).value || '#000000'); }
  });

  /* ---- Sliders ---- */
  if (hueSlider) {
    hueSlider.addEventListener('input', function() {
      state.h = parseInt(this.value);
      drawCanvas();
      updateOutputs();
    });
  }
  if (alphaSlider) {
    alphaSlider.addEventListener('input', function() {
      state.a = parseInt(this.value);
      updateOutputs();
    });
  }

  /* ---- Native input ---- */
  if (native) {
    native.addEventListener('input', function() { applyHex(this.value); });
  }

  /* ---- Text inputs ---- */
  if (hexIn) {
    hexIn.addEventListener('change', function() {
      var v = this.value.trim();
      if (/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(v)) {
        applyHex(v.startsWith('#') ? v : '#' + v);
      }
    });
  }

  /* ---- Copy buttons ---- */
  document.querySelectorAll('.cp-copy-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var target = document.getElementById(btn.getAttribute('data-target'));
      if (target && navigator.clipboard) {
        navigator.clipboard.writeText(target.value).then(function() { showToast(); });
      }
    });
  });

  function showToast() {
    if (!toast) return;
    toast.classList.add('cp-toast-visible');
    setTimeout(function() { toast.classList.remove('cp-toast-visible'); }, 1800);
  }

  /* ---- Init ---- */
  drawCanvas();
  positionCursor();
  updateOutputs();

})();
