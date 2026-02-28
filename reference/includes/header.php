<?php
/**
 * ==========================================================================
 * Value.Codes — Global Header
 * ==========================================================================
 *
 * Fixed navigation bar with:
 *   - Brand logo + tagline
 *   - Nav links: Tools, Resources, Blog
 *   - Action buttons: Search, Compiler, Community, Login
 *   - Profile dropdown (hidden by default, shown via JS auth)
 *   - Mobile hamburger menu
 *
 * Dependencies:
 *   - css/global.css
 *   - css/header.css
 *   - js/header.js (deferred)
 *
 * Zero inline styles. Zero inline scripts. Zero onclick handlers.
 *
 * @version  2.0.0
 * ==========================================================================
 */
?>
<header>
  <nav class="site-nav" role="navigation" aria-label="Main navigation">
    <div class="nav-inner">

      <!-- ============================================================
           BRAND — Logo + Divider + Tagline
           ============================================================ -->
      <div class="nav-brand">
        <a href="/" class="nav-logo" aria-label="Value.Codes Home">
          <span class="nav-logo-text">Value<span class="nav-logo-dot">.</span>Codes</span>
        </a>
        <span class="nav-divider" aria-hidden="true"></span>
        <span class="nav-tagline">Developer Tools</span>
      </div>

      <!-- ============================================================
           RIGHT SECTION — Nav Links + Actions
           ============================================================ -->
      <div class="nav-right">

        <!-- Nav Links (No Community here — it's in actions) -->
        <ul class="nav-links" id="nav-links" role="list">
          <li><a href="/tools/" class="nav-link">Tools</a></li>
          <li><a href="/resources/" class="nav-link">Resources</a></li>
          <li><a href="/blog/" class="nav-link">Blog</a></li>
        </ul>

        <!-- Action Buttons -->
        <div class="nav-actions">

          <!-- Search -->
          <a href="/search" class="nav-search-btn" aria-label="Search" title="Search tools and resources">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <span>Search</span>
          </a>

          <!-- Community -->
          <a href="/community/" class="nav-btn-community" title="Developer Community">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Community</span>
          </a>

          <!-- Compiler -->
          <a href="/compiler/" class="nav-btn-compiler" title="Online Code Compiler" aria-label="Open Compiler">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            <span>Compiler</span>
          </a>

          <!-- Login (visible when logged out) -->
          <a href="/login/" class="nav-btn-login" id="nav-login-btn" title="Login to your account">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            <span>Login</span>
          </a>

          <!-- Profile Dropdown (hidden by default — shown via JS when authenticated) -->
          <div id="nav-profile-item" class="nav-profile-item nav-profile-hidden">
            <div class="nav-profile-wrapper">
              <button class="nav-profile-btn" id="nav-profile-toggle" type="button" aria-label="Profile menu" aria-expanded="false" aria-haspopup="true">
                <img class="nav-avatar" id="nav-avatar" src="<https://ui-avatars.com/api/?name=U&amp;background=c9281a&amp;color=fff&amp;size=52>" alt="User avatar" width="28" height="28" loading="lazy">
                <span id="nav-user-name" class="nav-username">Profile</span>
                <span class="nav-pro-badge nav-pro-badge-empty" id="nav-pro-badge"></span>
                <svg class="nav-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <div class="nav-dropdown" id="nav-profile-dropdown" role="menu" aria-hidden="true">
                <div class="dropdown-header">
                  <p class="dropdown-name" id="dropdown-name">User</p>
                  <p class="dropdown-email" id="dropdown-email">email@example.com</p>
                </div>
                <div class="dropdown-pro-status dropdown-pro-status-empty" id="dropdown-pro-status"></div>
                <a href="/profile/" class="dropdown-item" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  My Profile
                </a>
                <a href="/settings/" class="dropdown-item" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Settings
                </a>
                <div class="dropdown-divider" role="separator"></div>
                <button class="dropdown-item dropdown-logout" id="nav-logout-btn" type="button" role="menuitem">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Log Out
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- ============================================================
           MOBILE TOGGLE — Hamburger Button
           ============================================================ -->
      <button class="menu-toggle" id="menu-toggle" type="button" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="nav-links">
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>

    </div>
  </nav>
</header>