/**
 * ============================================================
 * blog.js — Universal Blog JavaScript
 * ============================================================
 * Handles:
 *   - Blog index: search, category filter
 *   - Blog post: floating sticky TOC dropdown
 *   - Blog post: TOC active heading tracking
 *   - Blog post: Share buttons (Twitter, LinkedIn, Copy)
 * ============================================================
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

  /* ========== BLOG POST: FLOATING TOC ========== */
  var tocContainer  = $('[data-blog-toc]');
  var articleBody   = $('#blogArticleBody') || $('.blog-article__body');
  var tocBar        = $('#blogTocBar');
  var tocToggleBtn  = $('#tocToggleBtn');
  var tocDropdown   = $('#tocDropdown');
  var tocActiveLabel = $('#tocActiveLabel');

  if (tocContainer && articleBody) {
    var headings = $$('h2[id], h3[id]', articleBody);

    if (headings.length > 0) {
      /* Build TOC links */
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
          closeToC();
          var target = document.getElementById(id);
          if (target) {
            var navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 62;
            var barH = tocBar ? tocBar.offsetHeight : 0;
            var top  = target.getBoundingClientRect().top + window.pageYOffset - navH - barH - 8;
            window.scrollTo({ top: top, behavior: 'smooth' });
          }
        });
        frag.appendChild(a);
      });
      tocContainer.appendChild(frag);

      /* Show TOC bar once page scrolls past the hero */
      if (tocBar) {
        var heroSection = $('.blog-post-hero');
        var observer = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) {
              tocBar.removeAttribute('hidden');
            } else {
              tocBar.setAttribute('hidden', '');
              closeToC();
            }
          });
        }, { threshold: 0 });
        if (heroSection) observer.observe(heroSection);
      }

      /* Toggle dropdown */
      if (tocToggleBtn && tocDropdown) {
        tocToggleBtn.addEventListener('click', function () {
          var open = tocToggleBtn.getAttribute('aria-expanded') === 'true';
          open ? closeToC() : openToC();
        });

        /* Close on outside click */
        document.addEventListener('click', function (e) {
          if (tocBar && !tocBar.contains(e.target)) closeToC();
        });

        /* Close on Escape */
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') closeToC();
        });
      }

      function openToC() {
        tocToggleBtn.setAttribute('aria-expanded', 'true');
        tocDropdown.removeAttribute('hidden');
      }
      function closeToC() {
        if (!tocToggleBtn) return;
        tocToggleBtn.setAttribute('aria-expanded', 'false');
        if (tocDropdown) tocDropdown.setAttribute('hidden', '');
      }

      /* ── Active heading tracking ── */
      var tocLinks = $$('.blog-toc__link');

      var headingObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute('id');
            tocLinks.forEach(function (link) {
              var active = link.getAttribute('data-toc-link') === id;
              link.classList.toggle('is-active', active);
            });
            /* Update the bar label to current section */
            var activeLink = tocLinks.find(function (l) { return l.getAttribute('data-toc-link') === id; });
            if (activeLink && tocActiveLabel) {
              tocActiveLabel.textContent = activeLink.textContent.length > 40
                ? activeLink.textContent.slice(0, 40) + '…'
                : activeLink.textContent;
            }
          }
        });
      }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });

      headings.forEach(function (h) { headingObserver.observe(h); });

    } else {
      /* No headings — keep bar hidden */
    }
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
        var originalText  = btn.textContent;
        var originalLabel = btn.getAttribute('aria-label');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href).then(function () {
            btn.textContent = 'Copied!';
            setTimeout(function () {
              btn.textContent = originalText;
              btn.setAttribute('aria-label', originalLabel);
            }, 2000);
          }).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }
        function fallbackCopy() {
          var tmp = document.createElement('input');
          tmp.value = window.location.href;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          document.body.removeChild(tmp);
        }
      }
    });
  });

})();
