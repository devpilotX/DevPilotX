/**
 * ============================================================
 * blog.js — Universal Blog JavaScript
 * ============================================================
 * Handles:
 *   - Blog index: search, category filter, tag filter
 *   - Blog post: Table of Contents generation, active tracking
 *   - Blog post: Share buttons (Twitter, LinkedIn, Copy)
 *   - Smooth scroll to headings
 * ============================================================
 */

(function () {
  'use strict';

  /* ========== UTILITIES ========== */
  function $(selector, context) {
    return (context || document).querySelector(selector);
  }

  function $$(selector, context) {
    return Array.from((context || document).querySelectorAll(selector));
  }

  /* ========== BLOG INDEX: SEARCH FILTER ========== */
  var searchInput = $('[data-blog-search]');
  var blogGrid = $('[data-blog-grid]');
  var blogEmpty = $('[data-blog-empty]');
  var debounceTimer;

  /* ========== BLOG INDEX: CATEGORY SELECT NAVIGATION ========== */
  var categorySelect = document.getElementById('blog-category-filter');
  if (categorySelect) {
    categorySelect.addEventListener('change', function () {
      if (this.value) {
        window.location.href = this.value;
      }
    });
  }

  if (searchInput && blogGrid) {
    searchInput.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(filterBlogs, 200);
    });
    /* Run on page load to set correct initial state */
    filterBlogs();
  }

  /* ========== FILTER LOGIC (search only — categories use server routing) ========== */
  function filterBlogs() {
    if (!blogGrid) return;

    var cards = $$('.blog-card', blogGrid);
    var searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    var visibleCount = 0;

    cards.forEach(function (card) {
      var cardTitle = card.getAttribute('data-title') || '';
      var cardTags  = card.getAttribute('data-tags')  || '';
      var cardCat   = card.getAttribute('data-category') || '';
      var haystack  = (cardTitle + ' ' + cardTags + ' ' + cardCat).toLowerCase();

      var matchesSearch = !searchTerm || haystack.indexOf(searchTerm) !== -1;

      if (matchesSearch) {
        card.classList.remove('is-hidden');
        visibleCount++;
      } else {
        card.classList.add('is-hidden');
      }
    });

    /* Show/hide empty state */
    if (blogEmpty) {
      if (visibleCount === 0) {
        blogEmpty.classList.remove('is-hidden');
      } else {
        blogEmpty.classList.add('is-hidden');
      }
    }
  }

  /* ========== BLOG POST: TABLE OF CONTENTS GENERATION ========== */
  var tocContainer = $('[data-blog-toc]');
  var articleBody = $('.blog-article__body');

  if (tocContainer && articleBody) {
    var headings = $$('h2[id], h3[id]', articleBody);
    var fragment = document.createDocumentFragment();

    headings.forEach(function (heading) {
      var id = heading.getAttribute('id');
      var text = heading.textContent;
      var isH3 = heading.tagName === 'H3';

      var link = document.createElement('a');
      link.href = '#' + id;
      link.className = 'blog-toc__link' + (isH3 ? ' blog-toc__link--h3' : '');
      link.setAttribute('data-toc-link', id);
      link.textContent = text;
      fragment.appendChild(link);
    });

    tocContainer.appendChild(fragment);

    /* ========== TOC: ACTIVE HEADING TRACKING ========== */
    var tocLinks = $$('.blog-toc__link');

    if (tocLinks.length > 0 && headings.length > 0) {
      var observerOptions = {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0
      };

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute('id');
            tocLinks.forEach(function (link) {
              if (link.getAttribute('data-toc-link') === id) {
                link.classList.add('is-active');
              } else {
                link.classList.remove('is-active');
              }
            });
          }
        });
      }, observerOptions);

      headings.forEach(function (heading) {
        observer.observe(heading);
      });
    }

    /* ========== TOC: SMOOTH SCROLL ON CLICK ========== */
    tocLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var targetId = link.getAttribute('href').substring(1);
        var targetEl = document.getElementById(targetId);
        if (targetEl) {
          var offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 62;
          var top = targetEl.getBoundingClientRect().top + window.pageYOffset - offset - 20;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

  /* ========== BLOG POST: SHARE BUTTONS ========== */
  var shareBtns = $$('[data-share]');

  shareBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var type = btn.getAttribute('data-share');
      var url = encodeURIComponent(window.location.href);
      var title = encodeURIComponent(document.title);
      var shareUrl = '';

      switch (type) {
        case 'twitter':
          shareUrl = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title;
          window.open(shareUrl, '_blank', 'width=600,height=400');
          break;

        case 'linkedin':
          shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
          window.open(shareUrl, '_blank', 'width=600,height=400');
          break;

        case 'copy':
          if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href).then(function () {
              /* Show copied feedback */
              var originalText = btn.textContent || '';
              var originalAriaLabel = btn.getAttribute('aria-label');
              btn.textContent = 'Copied!';
              btn.setAttribute('aria-label', 'Link copied');
              setTimeout(function () {
                if (originalText === '') {
                  btn.textContent = '';
                } else {
                  btn.textContent = originalText.indexOf('Copied') !== -1 ? 'Copy Link' : originalText;
                }
                btn.setAttribute('aria-label', originalAriaLabel || 'Copy article link');
              }, 2000);
            }).catch(function () {
              /* Fallback: select text from a temporary input */
              var temp = document.createElement('input');
              temp.value = window.location.href;
              document.body.appendChild(temp);
              temp.select();
              document.execCommand('copy');
              document.body.removeChild(temp);
            });
          }
          break;
      }
    });
  });

})();
