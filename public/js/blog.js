/**
 * blog.js — Blog JavaScript
 * Handles: blog listing search/filter, sidebar TOC, reading progress, share buttons.
 */

(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  /* ========== BLOG INDEX: CATEGORY SELECT NAVIGATION ========== */
  var categorySelect = document.getElementById('blog-category-filter');
  if (categorySelect) {
    categorySelect.addEventListener('change', function () {
      if (this.value) window.location.href = this.value;
    });
  }

  /* ========== BLOG INDEX: SEARCH FILTER ========== */
  var searchInput = $('[data-blog-search]');
  var blogGrid    = $('[data-blog-grid]');
  var blogEmpty   = $('[data-blog-empty]');
  var debounceTimer;

  if (searchInput && blogGrid) {
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterBlogs, 200);
    });
    filterBlogs();
  }

  function filterBlogs() {
    if (!blogGrid) return;
    var cards      = $$('.blog-card', blogGrid);
    var searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    var visible    = 0;

    cards.forEach(function (card) {
      var haystack = ([
        card.getAttribute('data-title') || '',
        card.getAttribute('data-tags')  || '',
        card.getAttribute('data-category') || ''
      ]).join(' ').toLowerCase();

      var match = !searchTerm || haystack.indexOf(searchTerm) !== -1;
      card.classList.toggle('is-hidden', !match);
      if (match) visible++;
    });

    if (blogEmpty) blogEmpty.classList.toggle('is-hidden', visible > 0);
  }

  /* ========== BLOG POST: SIDEBAR TOC ========== */
  var tocContainer = $('[data-blog-toc]');
  var articleBody  = $('#blogArticleBody');

  if (tocContainer && articleBody) {
    var headings = $$('h2[id], h3[id]', articleBody);

    if (headings.length > 0) {
      var frag = document.createDocumentFragment();
      headings.forEach(function (h) {
        var id   = h.getAttribute('id');
        var text = h.textContent.trim();
        var isH3 = h.tagName === 'H3';
        var a    = document.createElement('a');
        a.href   = '#' + id;
        a.className = 'blog-toc__link' + (isH3 ? ' blog-toc__link--h3' : '');
        a.setAttribute('data-toc-link', id);
        a.textContent = text;
        a.addEventListener('click', function (e) {
          e.preventDefault();
          var target = document.getElementById(id);
          if (target) {
            var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 62;
            var top  = target.getBoundingClientRect().top + window.pageYOffset - navH - 16;
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        });
        frag.appendChild(a);
      });
      tocContainer.appendChild(frag);

      /* Active heading tracking */
      var tocLinks = $$('.blog-toc__link');

      var headingObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute('id');
            tocLinks.forEach(function (link) {
              link.classList.toggle('is-active', link.getAttribute('data-toc-link') === id);
            });
          }
        });
      }, { rootMargin: '-' + (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 62) + 'px 0px -60% 0px', threshold: 0 });

      headings.forEach(function (h) { headingObserver.observe(h); });
    } else {
      /* No headings — hide sidebar */
      var sidebar = document.getElementById('blogTocSidebar');
      if (sidebar) sidebar.style.display = 'none';
    }
  }

  /* ========== BLOG POST: READING PROGRESS BAR ========== */
  var progressBar = document.getElementById('blogProgressBar');
  if (progressBar) {
    function updateProgress() {
      var doc = document.documentElement;
      var scrollTop = window.pageYOffset || doc.scrollTop;
      var total = doc.scrollHeight - doc.clientHeight;
      var pct = total > 0 ? Math.min(100, (scrollTop / total) * 100) : 0;
      progressBar.style.setProperty('--progress', pct.toFixed(1) + '%');
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
  }

  /* ========== BLOG POST: SHARE BUTTONS ========== */
  $$('[data-share]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type     = btn.getAttribute('data-share');
      var url      = encodeURIComponent(window.location.href);
      var title    = encodeURIComponent(document.title);
      var shareUrl = '';

      if (type === 'twitter') {
        shareUrl = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title;
        window.open(shareUrl, '_blank', 'width=600,height=400,noopener');
      } else if (type === 'linkedin') {
        shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
        window.open(shareUrl, '_blank', 'width=600,height=400,noopener');
      } else if (type === 'copy') {
        var originalText = btn.textContent.trim();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href).then(function () {
            btn.textContent = 'Copied!';
            setTimeout(function () {
              btn.textContent = originalText;
            }, 2000);
          }).catch(function () { /* clipboard unavailable — silent fail */ });
        }
      }
    });
  });

})();
