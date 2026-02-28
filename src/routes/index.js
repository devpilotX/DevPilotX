/**
 * ============================================================
 * Value.Codes — Homepage Route
 * ============================================================
 * GET / — Renders the homepage with full SEO data,
 * structured data (WebSite + Organization + WebApplication +
 * BreadcrumbList + FAQPage), and page-specific CSS/JS.
 * ============================================================
 */

'use strict';

const express = require('express');
const router = express.Router();

/* ========== GET / — HOMEPAGE ========== */
router.get('/', (req, res) => {
  const siteUrl = process.env.SITE_URL || 'https://value.codes';

  res.render('home', {
    /* SEO meta tags */
    title: 'Value.Codes — Free Developer Tools | JSON Formatter, Regex Builder, Online Compiler & More',
    description: 'Value.Codes — Free online developer tools: JSON Formatter, Regex Builder, Diff Checker, Base64 Encoder, Color Picker, Cron Builder, JWT Decoder, Hash Generator, Mock Data Generator, Code Formatter, and a 19-language online compiler. Join our developer community. No sign-up required.',
    keywords: 'Value.Codes, Value Codes, free developer tools, JSON formatter online, regex builder, diff checker, base64 encoder decoder, color picker tool, cron expression builder, JWT decoder online, hash generator MD5 SHA256, mock data generator, code formatter online, online compiler, free code compiler, developer community, open source contribute, developer utilities, web developer tools, programming tools free, developer chat, coding community 2026',
    canonical: siteUrl + '/',
    robots: 'index, follow',

    /* Open Graph */
    ogType: 'website',
    ogTitle: 'Value.Codes — Free Developer Tools & Community',
    ogDescription: 'Free developer tools: JSON Formatter, Regex Builder, Diff Checker, Hash Generator, JWT Decoder, Online Compiler & developer community. No sign-up needed.',
    ogImage: `${siteUrl}/images/og-image.jpg`,

    /* Twitter */
    twitterDescription: 'JSON Formatter, Regex Builder, Diff Checker, Online Compiler, Developer Chat — all free, no sign-up.',
    twitterImage: `${siteUrl}/images/twitter-card.jpg`,

    /* Structured data */
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Value.Codes',
        'alternateName': ['Value Codes', 'ValueCodes'],
        'url': siteUrl,
        'logo': `${siteUrl}/favicon.png`,
        'description': 'Free online developer tools platform with community features.',
        'sameAs': [
          'https://github.com/Value-Codes',
          'https://twitter.com/value_codes',
          'https://www.linkedin.com/company/112110060',
          'https://www.youtube.com/@value_codes'
        ],
        'contactPoint': {
          '@type': 'ContactPoint',
          'contactType': 'Customer Support',
          'email': 'contact@value.codes',
          'availableLanguage': 'English'
        },
        'areaServed': 'Worldwide'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'Value.Codes',
        'url': siteUrl,
        'description': 'Free developer tools platform with JSON Formatter, Regex Builder, Diff Checker, Online Compiler, and developer community.',
        'publisher': {
          '@type': 'Organization',
          'name': 'Value.Codes',
          'logo': {
            '@type': 'ImageObject',
            'url': `${siteUrl}/favicon.png`
          }
        },
        'potentialAction': {
          '@type': 'SearchAction',
          'target': {
            '@type': 'EntryPoint',
            'urlTemplate': `${siteUrl}/search?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        },
        'inLanguage': 'en-US'
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Value.Codes Developer Tools',
        'url': `${siteUrl}/tools/`,
        'applicationCategory': 'DeveloperApplication',
        'operatingSystem': 'All',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        },
        'description': 'Free browser-based developer tools including JSON Formatter, Regex Builder, Diff Checker, Base64 Encoder, Color Picker, Cron Builder, JWT Decoder, Hash Generator, Mock Data Generator, Code Formatter, and a 19-language online compiler.',
        'featureList': [
          'JSON Formatter & Validator',
          'Regex Builder with Live Preview',
          'Diff Checker (Side by Side)',
          'Base64 Encoder / Decoder',
          'Color Picker & Converter',
          'Cron Expression Builder',
          'JWT Decoder',
          'Hash Generator (MD5, SHA-256)',
          'Mock Data Generator',
          'Code Formatter & Beautifier',
          'Online Compiler (19 Languages)',
          'Developer Community & Chat',
          'Open Source Contributions'
        ]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [{
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': `${siteUrl}/`
        }]
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': [
          {
            '@type': 'Question',
            'name': 'Is Value.Codes really free?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. All core developer tools on Value.Codes are completely free with no sign-up required. Premium features are available for Pro members.'
            }
          },
          {
            '@type': 'Question',
            'name': 'What tools does Value.Codes offer?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Value.Codes offers JSON Formatter, Regex Builder, Diff Checker, Base64 Encoder, Color Picker, Cron Builder, JWT Decoder, Hash Generator, Mock Data Generator, Code Formatter, and an Online Compiler supporting 19 programming languages.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Do I need to login to use the community?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. The developer community chat requires a free account. You can create one in seconds to join discussions, share code, and connect with other developers.'
            }
          },
          {
            '@type': 'Question',
            'name': 'Can I contribute to Value.Codes?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Yes. Value.Codes is open-source. You can contribute by building new tools, fixing bugs, improving documentation, or suggesting features on our GitHub repository.'
            }
          },
          {
            '@type': 'Question',
            'name': 'What are Value.Codes Pro features?',
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': 'Value.Codes Pro offers advanced compiler features, priority support, ad-free experience, extended API limits, and exclusive community channels. All core tools remain free forever.'
            }
          }
        ]
      }
    ],

    /* Page-specific assets */
    pageCSS: ['/css/home.css'],
    pageJS: ['/js/home.js']
  });
});

module.exports = router;
