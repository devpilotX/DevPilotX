/* ================================================================
   src/routes/compiler.js
   Value.Codes — Online Compiler Page Route

   GET /compiler  → renders views/compiler.ejs

   Loads CodeMirror 5 via CDN through pageCSS / pageJS arrays so
   all CSS lands in <head> and all JS lands before </body> in the
   correct order (CodeMirror first, then our compiler.js).
   ================================================================ */

'use strict';

var express = require('express');
var router  = express.Router();

/* ========== CODEMIRROR 5 CDN ========== */
var CM = 'https://cdn.jsdelivr.net/npm/codemirror@5.65.16';

var COMPILER_CSS = [
  CM + '/lib/codemirror.min.css',
  CM + '/theme/dracula.min.css',
  CM + '/addon/fold/foldgutter.min.css',
  '/css/compiler.css'
];

var COMPILER_JS = [
  /* Core */
  CM + '/lib/codemirror.min.js',
  /* Addons */
  CM + '/addon/edit/matchbrackets.min.js',
  CM + '/addon/edit/closebrackets.min.js',
  CM + '/addon/fold/foldcode.min.js',
  CM + '/addon/fold/foldgutter.min.js',
  CM + '/addon/fold/brace-fold.min.js',
  CM + '/addon/fold/indent-fold.min.js',
  CM + '/addon/selection/active-line.min.js',
  /* Language modes */
  CM + '/mode/python/python.min.js',
  CM + '/mode/javascript/javascript.min.js', /* also covers TypeScript */
  CM + '/mode/clike/clike.min.js',           /* Java, C, C++, C#, Kotlin, Scala */
  CM + '/mode/go/go.min.js',
  CM + '/mode/rust/rust.min.js',
  CM + '/mode/ruby/ruby.min.js',
  CM + '/mode/php/php.min.js',
  CM + '/mode/swift/swift.min.js',
  CM + '/mode/r/r.min.js',
  CM + '/mode/perl/perl.min.js',
  CM + '/mode/lua/lua.min.js',
  CM + '/mode/shell/shell.min.js',           /* Bash */
  CM + '/mode/sql/sql.min.js',
  /* Our compiler logic — must come LAST */
  '/js/compiler.js'
];

/* ========== JSON-LD SCHEMA ========== */
var SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Value.Codes Online Compiler',
    'applicationCategory': 'DeveloperApplication',
    'operatingSystem': 'Web Browser',
    'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
    'description': 'Free online compiler and code runner supporting 19 programming languages. No signup or installation required.',
    'url': 'https://value.codes/compiler',
    'featureList': [
      'Run Python, JavaScript, Java, C++, Rust, Go, Ruby, PHP and 11 more',
      'STDIN support',
      'Syntax highlighting via CodeMirror',
      'Dark and light themes',
      'Auto-save to localStorage',
      'Download code as file'
    ]
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home',            'item': 'https://value.codes' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Online Compiler', 'item': 'https://value.codes/compiler' }
    ]
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': [
      {
        '@type': 'Question',
        'name': 'Is the online compiler free to use?',
        'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes, the Value.Codes Online Compiler is completely free. No signup, no subscription, no hidden costs.' }
      },
      {
        '@type': 'Question',
        'name': 'How does the code execution work?',
        'acceptedAnswer': { '@type': 'Answer', 'text': 'JavaScript runs directly in your browser with no API call. All other languages are sent to Piston, an open-source sandboxed execution engine.' }
      },
      {
        '@type': 'Question',
        'name': 'Which programming languages are supported?',
        'acceptedAnswer': { '@type': 'Answer', 'text': 'Python, JavaScript, TypeScript, Java, C++, C, C#, Go, Rust, Ruby, PHP, Swift, Kotlin, Scala, R, Perl, Lua, Bash, and SQL (SQLite).' }
      },
      {
        '@type': 'Question',
        'name': 'Is there a time limit on code execution?',
        'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes, 30 seconds per execution. This prevents infinite loops from blocking resources.' }
      },
      {
        '@type': 'Question',
        'name': 'Is my code stored anywhere?',
        'acceptedAnswer': { '@type': 'Answer', 'text': 'No. Your code is auto-saved only in your browser\'s localStorage. It is never stored on our servers.' }
      },
      {
        '@type': 'Question',
        'name': 'Can I provide input to my program?',
        'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes. Click the STDIN button in the editor toolbar to open the standard input panel and type your input there.' }
      },
      {
        '@type': 'Question',
        'name': 'Does the editor support syntax highlighting?',
        'acceptedAnswer': { '@type': 'Answer', 'text': 'Yes. CodeMirror 5 provides syntax highlighting for all 19 languages with dark and light theme support.' }
      }
    ]
  }
];

/* ========== GET /compiler ========== */
router.get('/', function (req, res) {
  var siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('compiler', {
    title:       'Online Compiler — Run Code in 19 Languages Free | Value.Codes',
    description: 'Free online compiler and code runner. Write and execute Python, JavaScript, Java, C++, Rust, Go, and 13 more languages directly in your browser. No signup required.',
    keywords:    'online compiler, run code online, python compiler online, javascript runner online, java compiler online, c++ compiler online, free code runner, execute code browser, 19 languages compiler, online ide free',
    canonical:   siteUrl + '/compiler/',
    robots:      'index, follow',
    ogType:      'website',
    ogImage:     siteUrl + '/images/og-image.svg',
    schema:      SCHEMA,
    pageCSS:     COMPILER_CSS,
    pageJS:      COMPILER_JS
  });
});

module.exports = router;
