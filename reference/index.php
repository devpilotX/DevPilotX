<?php
/**
 * ==========================================================================
 * Value.Codes — Homepage (index.php)
 * ==========================================================================
 *
 * Production-grade homepage for Value.Codes developer tools platform.
 *
 * Page Sections (in order):
 *   [01] Hero          — Value proposition + code card
 *   [02] Tools         — 10 free browser-based developer tools
 *   [03] Compiler      — 19-language online compiler
 *   [04] Community     — Discord-style chat (login-gated)
 *   [05] Resources     — Curated developer resources
 *   [06] Newsletter    — Email signup CTA
 *   [07] Contribute    — Open source contribution
 *   [08] Final CTA     — Closing call to action
 *
 * Technical Compliance:
 *   - Zero inline CSS (no style attributes, no <style> tags)
 *   - Zero inline JS (no onclick, no <script> with code)
 *   - All CSS via external files in /css/
 *   - All JS via external files in /js/ (deferred)
 *   - Structured data via application/ld+json (not executable JS)
 *   - Google AdSense policy compliant
 *   - Google Search Console indexing optimized
 *   - GDPR cookie consent
 *   - WCAG 2.1 AA accessibility
 *   - Core Web Vitals optimized
 *
 * @version  2.0.0
 * ==========================================================================
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link rel="icon" href="/favicon.png" sizes="96x96" type="image/png">

  <!-- ================================================================
       GOOGLE ADSENSE — Publisher Verification
       ================================================================ -->
  <meta name="google-adsense-account" content="ca-pub-6484525483464374">

  <!-- ================================================================
       PRIMARY META TAGS — SEO
       ================================================================ -->
  <title>Value.Codes — Free Developer Tools | JSON Formatter, Regex Builder, Online Compiler &amp; More</title>
  <meta name="title" content="Value.Codes — Free Developer Tools | JSON Formatter, Regex Builder, Online Compiler &amp; More">
  <meta name="description" content="Value.Codes — Free online developer tools: JSON Formatter, Regex Builder, Diff Checker, Base64 Encoder, Color Picker, Cron Builder, JWT Decoder, Hash Generator, Mock Data Generator, Code Formatter, and a 19-language online compiler. Join our developer community. No sign-up required.">
  <meta name="keywords" content="Value.Codes, Value Codes, free developer tools, JSON formatter online, regex builder, diff checker, base64 encoder decoder, color picker tool, cron expression builder, JWT decoder online, hash generator MD5 SHA256, mock data generator, code formatter online, online compiler, free code compiler, developer community, open source contribute, developer utilities, web developer tools, programming tools free, developer chat, coding community 2026">
  <meta name="author" content="Value.Codes">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <meta name="language" content="English">
  <meta name="revisit-after" content="3 days">
  <meta name="rating" content="general">
  <meta name="distribution" content="global">
  <link rel="canonical" href="<https://value.codes/>">

  <!-- ================================================================
       OPEN GRAPH / FACEBOOK
       ================================================================ -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="<https://value.codes/>">
  <meta property="og:title" content="Value.Codes — Free Developer Tools &amp; Community">
  <meta property="og:description" content="Free developer tools: JSON Formatter, Regex Builder, Diff Checker, Hash Generator, JWT Decoder, Online Compiler &amp; developer community. No sign-up needed.">
  <meta property="og:image" content="<https://value.codes/images/og-image.jpg>">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Value.Codes — Free Developer Tools Platform">
  <meta property="og:site_name" content="Value.Codes">
  <meta property="og:locale" content="en_US">

  <!-- ================================================================
       TWITTER CARD
       ================================================================ -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@value_codes">
  <meta name="twitter:creator" content="@value_codes">
  <meta name="twitter:url" content="<https://value.codes/>">
  <meta name="twitter:title" content="Value.Codes — Free Developer Tools &amp; Community">
  <meta name="twitter:description" content="JSON Formatter, Regex Builder, Diff Checker, Online Compiler, Developer Chat — all free, no sign-up.">
  <meta name="twitter:image" content="<https://value.codes/images/twitter-card.jpg>">
  <meta name="twitter:image:alt" content="Value.Codes — Free Developer Tools Platform">

  <!-- ================================================================
       APP META — PWA / Mobile
       ================================================================ -->
  <meta name="application-name" content="Value.Codes">
  <meta name="apple-mobile-web-app-title" content="Value.Codes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="format-detection" content="telephone=no">
  <meta name="theme-color" content="#ffffff">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta name="referrer" content="strict-origin-when-cross-origin">

  <!-- ================================================================
       STRUCTURED DATA — Organization
       ================================================================ -->
  <script type="application/ld+json">
  {
    "@context": "<https://schema.org>",
    "@type": "Organization",
    "name": "Value.Codes",
    "alternateName": ["Value Codes", "ValueCodes"],
    "url": "<https://value.codes>",
    "logo": "<https://value.codes/favicon.png>",
    "description": "Free online developer tools platform with community features.",
    "sameAs": [
      "<https://github.com/Value-Codes>",
      "<https://twitter.com/value_codes>",
      "<https://www.linkedin.com/company/112110060>",
      "<https://www.youtube.com/@value_codes>"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "contact@value.codes",
      "availableLanguage": "English"
    },
    "areaServed": "Worldwide"
  }
  </script>

  <!-- ================================================================
       STRUCTURED DATA — WebSite + SearchAction
       ================================================================ -->
  <script type="application/ld+json">
  {
    "@context": "<https://schema.org>",
    "@type": "WebSite",
    "name": "Value.Codes",
    "url": "<https://value.codes>",
    "description": "Free developer tools platform with JSON Formatter, Regex Builder, Diff Checker, Online Compiler, and developer community.",
    "publisher": {
      "@type": "Organization",
      "name": "Value.Codes",
      "logo": {
        "@type": "ImageObject",
        "url": "<https://value.codes/favicon.png>"
      }
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "<https://value.codes/search?q={search_term_string}>"
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": "en-US"
  }
  </script>

  <!-- ================================================================
       STRUCTURED DATA — WebApplication
       ================================================================ -->
  <script type="application/ld+json">
  {
    "@context": "<https://schema.org>",
    "@type": "WebApplication",
    "name": "Value.Codes Developer Tools",
    "url": "<https://value.codes/tools/>",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "description": "Free browser-based developer tools including JSON Formatter, Regex Builder, Diff Checker, Base64 Encoder, Color Picker, Cron Builder, JWT Decoder, Hash Generator, Mock Data Generator, Code Formatter, and a 19-language online compiler.",
    "featureList": [
      "JSON Formatter & Validator",
      "Regex Builder with Live Preview",
      "Diff Checker (Side by Side)",
      "Base64 Encoder / Decoder",
      "Color Picker & Converter",
      "Cron Expression Builder",
      "JWT Decoder",
      "Hash Generator (MD5, SHA-256)",
      "Mock Data Generator",
      "Code Formatter & Beautifier",
      "Online Compiler (19 Languages)",
      "Developer Community & Chat",
      "Open Source Contributions"
    ]
  }
  </script>

  <!-- ================================================================
       STRUCTURED DATA — BreadcrumbList
       ================================================================ -->
  <script type="application/ld+json">
  {
    "@context": "<https://schema.org>",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "<https://value.codes/>"
    }]
  }
  </script>

  <!-- ================================================================
       STRUCTURED DATA — FAQPage
       ================================================================ -->
  <script type="application/ld+json">
  {
    "@context": "<https://schema.org>",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Is Value.Codes really free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. All core developer tools on Value.Codes are completely free with no sign-up required. Premium features are available for Pro members."
        }
      },
      {
        "@type": "Question",
        "name": "What tools does Value.Codes offer?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Value.Codes offers JSON Formatter, Regex Builder, Diff Checker, Base64 Encoder, Color Picker, Cron Builder, JWT Decoder, Hash Generator, Mock Data Generator, Code Formatter, and an Online Compiler supporting 19 programming languages."
        }
      },
      {
        "@type": "Question",
        "name": "Do I need to login to use the community?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. The developer community chat requires a free account. You can create one in seconds to join discussions, share code, and connect with other developers."
        }
      },
      {
        "@type": "Question",
        "name": "Can I contribute to Value.Codes?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes. Value.Codes is open-source. You can contribute by building new tools, fixing bugs, improving documentation, or suggesting features on our GitHub repository."
        }
      },
      {
        "@type": "Question",
        "name": "What are Value.Codes Pro features?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Value.Codes Pro offers advanced compiler features, priority support, ad-free experience, extended API limits, and exclusive community channels. All core tools remain free forever."
        }
      }
    ]
  }
  </script>

  <!-- ================================================================
       EXTERNAL STYLESHEETS (Render-blocking — intentional for LCP)
       ================================================================ -->
  <link rel="stylesheet" href="/css/global.css">
  <link rel="stylesheet" href="/css/header.css">
  <link rel="stylesheet" href="/css/footer.css">
  <link rel="stylesheet" href="/css/home.css">
</head>
<body>

<!-- ====================================================================
     HEADER — Global Navigation
     ==================================================================== -->
<?php include __DIR__ . '/includes/header.php'; ?>

<!-- ====================================================================
     MAIN CONTENT
     ==================================================================== -->
<main id="main-content">


  <!-- ================================================================
       [01] HERO — Value Proposition
       ================================================================ -->
  <section class="hero" aria-label="Hero">
    <div class="hero-content">
      <div class="badge">
        <span class="badge-dot" aria-hidden="true"></span>
        <span>Free &amp; Open Source</span>
      </div>
      <h1>Developer tools,<br><span class="accent">done right.</span></h1>
      <p class="hero-lead">
        10+ free browser-based tools for everyday development.
        JSON formatting, regex building, diff checking, hashing, and more —
        plus an online compiler and developer community. No sign-up. No nonsense.
      </p>
      <div class="hero-badges">
        <span class="badge-pill">10+ Free Tools</span>
        <span class="badge-pill">19-Language Compiler</span>
        <span class="badge-pill">Dev Community</span>
      </div>
      <div class="hero-actions">
        <a href="/tools/" class="btn btn-primary">Explore All Tools</a>
        <a href="/login/" class="btn btn-secondary">Login / Sign Up</a>
      </div>
    </div>
    <div class="hero-visual">
      <div class="code-card">
        <div class="code-card-bar">
          <span class="code-dot code-dot--red"></span>
          <span class="code-dot code-dot--yellow"></span>
          <span class="code-dot code-dot--green"></span>
          <span class="code-card-label">value.codes/tools</span>
        </div>
        <div class="code-card-body">
          <span class="code-line"><span class="c-comment">// Free tools. No sign-up.</span></span>
          <span class="code-line"></span>
          <span class="code-line"><span class="c-keyword">const</span> tools = {</span>
          <span class="code-line">&nbsp;&nbsp;jsonFormatter:&nbsp;&nbsp;<span class="c-string">"instant"</span>,</span>
          <span class="code-line">&nbsp;&nbsp;regexBuilder:&nbsp;&nbsp;&nbsp;<span class="c-string">"live preview"</span>,</span>
          <span class="code-line">&nbsp;&nbsp;hashGenerator:&nbsp;&nbsp;<span class="c-string">"MD5, SHA-256"</span>,</span>
          <span class="code-line">&nbsp;&nbsp;diffChecker:&nbsp;&nbsp;&nbsp;&nbsp;<span class="c-string">"side by side"</span>,</span>
          <span class="code-line">&nbsp;&nbsp;jwtDecoder:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="c-string">"instant decode"</span>,</span>
          <span class="code-line">&nbsp;&nbsp;codeCompiler:&nbsp;&nbsp;&nbsp;<span class="c-string">"19 languages"</span>,</span>
          <span class="code-line">};</span>
        </div>
      </div>
    </div>
  </section>


  <!-- ================================================================
       [02] TOOLS — Developer Tools Showcase
       ================================================================ -->
  <section class="tools-section section-padding" id="tools" aria-label="Developer Tools">
    <div class="container">
      <div class="section-header">
        <span class="section-number">[01]</span>
        <h2>All Tools</h2>
      </div>
      <p class="section-desc">
        Every tool runs <strong>100% in your browser.</strong> Fast, private, and free forever.
      </p>

      <div class="tools-grid">
        <a href="/tools/json-formatter/" class="tool-card" tabindex="0">
          <span class="tool-card-icon" aria-hidden="true">{ }</span>
          <h3 class="tool-card-name">JSON Formatter</h3>
          <p class="tool-card-desc">Format, validate, and minify JSON instantly.</p>
          <span class="tool-card-arrow" aria-hidden="true">Open →</span>
        </a>

        <a href="/tools/regex-builder/" class="tool-card" tabindex="0">
          <span class="tool-card-icon" aria-hidden="true">.*</span>
          <h3 class="tool-card-name">Regex Builder</h3>
          <p class="tool-card-desc">Build and test regular expressions with live preview.</p>
          <span class="tool-card-arrow" aria-hidden="true">Open →</span>
        </a>

        <a href="/tools/diff-checker/" class="tool-card" tabindex="0">
          <span class="tool-card-icon" aria-hidden="true">⇄</span>
          <h3 class="tool-card-name">Diff Checker</h3>
          <p class="tool-card-desc">Compare text or code side by side. Spot every change.</p>
          <span class="tool-card-arrow" aria-hidden="true">Open →</span>
        </a>

        <a href="/tools/base64-encoder/" class="tool-card" tabindex="0">
          <span class="tool-card-icon" aria-hidden="true">🔤</span>
          <h3 class="tool-card-name">Base64 Encoder</h3>
          <p class="tool-card-desc">Encode and decode Base64 strings instantly.</p>
          <span class="tool-card-arrow" aria-hidden="true">Open →</span>
        </a>

        <a href="/tools/color-picker/" class="tool-card" tabindex="0">
          <span class="tool-card-icon" aria-hidden="true">🎨</span>
          <h3 class="tool-card-name">Color Picker</h3>
          <p class="tool-card-desc">Pick colors, convert HEX / RGB / HSL, generate palettes.</p>
          <span class="tool-card-arrow" aria-hidden="true">Open →</span>
        </a>

        <a href="/tools/cron-builder/" class="tool-card" tabindex="0">
          <span class="tool-card-icon" aria-hidden="true">⏰</span>
          <h3 class="tool-card-name">Cron Builder</h3>
          <p class="tool-card-desc">Build cron expressions visually. See next run times.</p>
          <span class="tool-card-arrow" aria-hidden="true">Open →</span>
        </a>

        <a href="/tools/jwt-decoder/" class="tool-card" tabindex="0">
          <span class="tool-card-icon" aria-hidden="true">🔑</span>
          <h3 class="tool-card-name">JWT Decoder</h3>
          <p class="tool-card-desc">Decode and inspect JSON Web Tokens. Check expiry.</p>
          <span class="tool-card-arrow" aria-hidden="true">Open →</span>
        </a>

        <a href="/tools/hash-generator/" class="tool-card" tabindex="0">
          <span class="tool-card-icon" aria-hidden="true">#</span>
          <h3 class="tool-card-name">Hash Generator</h3>
          <p class="tool-card-desc">Generate MD5, SHA-1, SHA-256, SHA-512 hashes.</p>
          <span class="tool-card-arrow" aria-hidden="true">Open →</span>
        </a>

        <a href="/tools/mock-data-generator/" class="tool-card" tabindex="0">
          <span class="tool-card-icon" aria-hidden="true">📋</span>
          <h3 class="tool-card-name">Mock Data Generator</h3>
          <p class="tool-card-desc">Generate fake names, emails, addresses, and JSON for testing.</p>
          <span class="tool-card-arrow" aria-hidden="true">Open →</span>
        </a>

        <a href="/tools/code-formatter/" class="tool-card" tabindex="0">
          <span class="tool-card-icon" aria-hidden="true">✨</span>
          <h3 class="tool-card-name">Code Formatter</h3>
          <p class="tool-card-desc">Beautify and format code in multiple languages.</p>
          <span class="tool-card-arrow" aria-hidden="true">Open →</span>
        </a>
      </div>
    </div>
  </section>


  <!-- ================================================================
       [03] COMPILER — Online Code Compiler
       ================================================================ -->
  <section class="compiler-section section-padding" aria-label="Online Compiler">
    <div class="container">
      <div class="compiler-grid">
        <div class="compiler-content">
          <div class="section-header">
            <span class="section-number">[02]</span>
            <h2>Online Compiler</h2>
          </div>
          <p>
            Write and run code directly in your browser. Supports 19 programming languages
            including Python, JavaScript, C++, Go, Rust, Java, and more.
            Zero setup. Instant output.
          </p>
          <div class="compiler-langs">
            <span class="lang-tag">Python</span>
            <span class="lang-tag">JavaScript</span>
            <span class="lang-tag">C++</span>
            <span class="lang-tag">Java</span>
            <span class="lang-tag">Go</span>
            <span class="lang-tag">Rust</span>
            <span class="lang-tag">TypeScript</span>
            <span class="lang-tag">C#</span>
            <span class="lang-tag">Ruby</span>
            <span class="lang-tag">PHP</span>
            <span class="lang-tag">Swift</span>
            <span class="lang-tag">Kotlin</span>
            <span class="lang-tag">+ 7 more</span>
          </div>
          <a href="/compiler/" class="btn btn-primary">Open Compiler →</a>
        </div>
        <div class="hero-visual">
          <div class="code-card">
            <div class="code-card-bar">
              <span class="code-dot code-dot--red"></span>
              <span class="code-dot code-dot--yellow"></span>
              <span class="code-dot code-dot--green"></span>
              <span class="code-card-label">compiler.py</span>
            </div>
            <div class="code-card-body">
              <span class="code-line"><span class="c-keyword">def</span> <span class="c-function">greet</span>(name):</span>
              <span class="code-line">&nbsp;&nbsp;&nbsp;&nbsp;<span class="c-keyword">return</span> <span class="c-string">f"Hello, {name}!"</span></span>
              <span class="code-line"></span>
              <span class="code-line"><span class="c-function">print</span>(greet(<span class="c-string">"Developer"</span>))</span>
              <span class="code-line"></span>
              <span class="code-line"><span class="c-comment"># Output: Hello, Developer!</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>


  <!-- ================================================================
       [04] COMMUNITY — Developer Community (Login-Gated, Discord-Style)
       ================================================================ -->
  <section class="community-section section-padding" id="community" aria-label="Developer Community">
    <div class="container">
      <div class="community-grid">

        <!-- Left: Description -->
        <div class="community-content">
          <div class="section-header">
            <span class="section-number">[03]</span>
            <h2>Developer Community</h2>
          </div>
          <p>
            A Discord-style chat built right into Value.Codes. Connect with developers worldwide —
            ask questions, share code, get reviews, and build together.
            Real conversations, not noise.
          </p>
          <ul class="community-features">
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Real-time chat with topic channels
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
              Connect with developers at every level
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Share code snippets and get feedback
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              Q&amp;A discussions and problem solving
            </li>
            <li>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Project showcases and collaboration
            </li>
          </ul>
          <p class="community-login-note">
            <strong>Free account required.</strong> Sign up in seconds to join the community.
          </p>
          <div class="community-actions">
            <a href="/login/" class="btn btn-primary">Login to Join</a>
            <a href="/community/" class="btn btn-secondary">Preview Community</a>
          </div>
        </div>

        <!-- Right: Chat Preview Card -->
        <div>
          <div class="chat-card">
            <div class="chat-card-header">
              <span class="chat-card-dot"></span>
              <span class="chat-card-title">#general</span>
              <span class="chat-card-count">342 online</span>
            </div>
            <div class="chat-message">
              <div class="chat-avatar">A</div>
              <div class="chat-bubble">
                <p class="chat-bubble-name">alex_dev</p>
                <p class="chat-bubble-text">Anyone have experience with Rust's borrow checker? Getting a lifetime error I can't figure out.</p>
              </div>
            </div>
            <div class="chat-message">
              <div class="chat-avatar chat-avatar--alt">S</div>
              <div class="chat-bubble">
                <p class="chat-bubble-name">sarah_codes</p>
                <p class="chat-bubble-text">Post the snippet — usually it's a reference outliving its scope. Happy to take a look!</p>
              </div>
            </div>
            <div class="chat-message">
              <div class="chat-avatar chat-avatar--green">M</div>
              <div class="chat-bubble">
                <p class="chat-bubble-name">mike_rs</p>
                <p class="chat-bubble-text">Check #rust-help — I posted a guide on common lifetime patterns yesterday. Should help! 🦀</p>
              </div>
            </div>
            <div class="chat-card-footer">
              <span class="chat-card-lock">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Login to start chatting
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>


  <!-- ================================================================
       [05] RESOURCES — Curated Developer Resources
       ================================================================ -->
  <section class="content-section" id="resources" aria-label="Developer Resources">
    <div class="section-header">
      <span class="section-number">[04]</span>
      <h2>Resources</h2>
    </div>
    <p class="section-desc">
      Curated resources to help you <strong>build better software,</strong> faster.
    </p>

    <div class="resources-grid">
      <a href="/resources/developer-tools/" class="resource-card">
        <span class="resource-icon" aria-hidden="true">🛠️</span>
        <div class="resource-body">
          <h3>Developer Tools</h3>
          <p>Essential tools and extensions every developer should know about.</p>
        </div>
      </a>

      <a href="/resources/best-practices/" class="resource-card">
        <span class="resource-icon" aria-hidden="true">✅</span>
        <div class="resource-body">
          <h3>Best Practices</h3>
          <p>Code quality, testing, security, and production-ready patterns.</p>
        </div>
      </a>

      <a href="/resources/career-roadmaps/" class="resource-card">
        <span class="resource-icon" aria-hidden="true">🗺️</span>
        <div class="resource-body">
          <h3>Career Roadmaps</h3>
          <p>Step-by-step guides for frontend, backend, DevOps, and more.</p>
        </div>
      </a>

      <a href="/resources/documentation/" class="resource-card">
        <span class="resource-icon" aria-hidden="true">📄</span>
        <div class="resource-body">
          <h3>Documentation</h3>
          <p>Links to official docs for popular languages, frameworks, and APIs.</p>
        </div>
      </a>

      <a href="/resources/essential-software/" class="resource-card">
        <span class="resource-icon" aria-hidden="true">💻</span>
        <div class="resource-body">
          <h3>Essential Software</h3>
          <p>IDEs, terminals, Git clients, and productivity apps for developers.</p>
        </div>
      </a>

      <a href="/resources/glossary/" class="resource-card">
        <span class="resource-icon" aria-hidden="true">📖</span>
        <div class="resource-body">
          <h3>Glossary</h3>
          <p>Clear definitions for technical terms, acronyms, and concepts.</p>
        </div>
      </a>
    </div>
  </section>


  <!-- ================================================================
       [06] NEWSLETTER — Email Signup CTA
       ================================================================ -->
  <section class="newsletter-section section-padding" aria-label="Newsletter signup">
    <div class="container">
      <h2>Stay Updated</h2>
      <p class="newsletter-desc">Get tool updates, community highlights, and developer tips. No spam, ever.</p>
      <div class="newsletter-actions">
        <a href="/newsletter-signup/" class="btn btn-primary">Subscribe Free</a>
        <a href="/blog/" class="btn btn-secondary">Read Blog</a>
      </div>
    </div>
  </section>


  <!-- ================================================================
       [07] CONTRIBUTE — Open Source Contribution
       ================================================================ -->
  <section class="contribute-section section-padding" id="contribute" aria-label="Contribute to Value.Codes">
    <div class="container">
      <div class="contribute-grid">

        <!-- Left: Description -->
        <div class="contribute-content">
          <div class="section-header">
            <span class="section-number">[05]</span>
            <h2>Contribute</h2>
          </div>
          <p>
            Value.Codes is open source. Every tool, every page, every line of code.
            We believe the best developer tools are built by developers.
            Ship a feature. Fix a bug. Write docs. Every contribution matters.
          </p>
          <div class="contribute-actions">
            <a href="<https://github.com/Value-Codes>" target="_blank" rel="noopener noreferrer" class="btn btn-dark">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              View on GitHub
            </a>
            <a href="/contribute/" class="btn btn-secondary">Contribution Guide</a>
          </div>
        </div>

        <!-- Right: Ways to Contribute -->
        <div class="contribute-ways">
          <div class="contribute-card">
            <span class="contribute-card-icon" aria-hidden="true">🛠️</span>
            <div class="contribute-card-body">
              <h3>Build a Tool</h3>
              <p>Propose and build new developer tools. Pick from our roadmap or bring your own idea.</p>
            </div>
          </div>
          <div class="contribute-card">
            <span class="contribute-card-icon" aria-hidden="true">🐛</span>
            <div class="contribute-card-body">
              <h3>Fix Bugs</h3>
              <p>Found something broken? Open an issue or submit a PR. Every fix helps thousands of devs.</p>
            </div>
          </div>
          <div class="contribute-card">
            <span class="contribute-card-icon" aria-hidden="true">📝</span>
            <div class="contribute-card-body">
              <h3>Write Documentation</h3>
              <p>Good docs matter. Help us write guides and make every tool easier to understand.</p>
            </div>
          </div>
          <div class="contribute-card">
            <span class="contribute-card-icon" aria-hidden="true">💡</span>
            <div class="contribute-card-body">
              <h3>Suggest Features</h3>
              <p>Have an idea? Open a feature request. The community votes, we build.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>


  <!-- ================================================================
       [08] FINAL CTA — Closing Call to Action
       ================================================================ -->
  <section class="final-cta section-padding" aria-label="Call to action">
    <div class="container">
      <div class="final-cta-inner">
        <h2>Start <span class="accent">building</span> today</h2>
        <p>Pick a tool. Join the community. Contribute to open source. All free, all fast, all yours.</p>
        <a href="/tools/" class="btn btn-primary">Explore All Tools</a>
      </div>
    </div>
  </section>


</main>

<!-- ====================================================================
     FOOTER — Global Footer
     ==================================================================== -->
<?php include __DIR__ . '/includes/footer.php'; ?>

<!-- ====================================================================
     EXTERNAL SCRIPTS (Deferred — non-blocking)
     ==================================================================== -->
<script src="/js/global.js" defer></script>
<script src="/js/header.js" defer></script>
<script src="/js/home.js" defer></script>

</body>
</html>