// auth.js — AdmitU shared authentication module
// Requires: @supabase/supabase-js@2 loaded in <head> before this script

(function () {
  'use strict';

  const SUPABASE_URL     = 'https://lscyjlstblsdlvogpvgm.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_TYV7nKo78-ixv1l9cVbNIg_HQ7yXtvx';

  const { createClient } = supabase;
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Expose globally so inline page scripts can reuse this client
  window.admituSupabase = sb;

  // ── Nav auth UI ──────────────────────────────────────────────────────────

  async function updateNavAuth() {
    const authEl = document.getElementById('nav-auth-item');
    const gsEl   = document.getElementById('nav-get-started');
    if (!authEl) return;

    const { data: { session } } = await sb.auth.getSession();

    if (session) {
      const user     = session.user;
      const meta     = user.user_metadata || {};
      const fullName = meta.full_name || meta.name || '';
      const display  = fullName || user.email.split('@')[0] || 'Account';
      const first    = display.split(' ')[0];
      const initials = display.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const avatar   = meta.avatar_url || null;

      authEl.innerHTML = `
        <div class="nav-user" id="navUserWrap">
          <button class="nav-user-btn" id="navUserBtn"
                  aria-label="Account menu" aria-haspopup="true" aria-expanded="false">
            ${avatar
              ? `<img src="${avatar}" alt="${first}" class="nav-avatar-img">`
              : `<div class="nav-avatar-initials">${initials}</div>`}
            <span class="nav-user-name">${first}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="nav-dropdown" id="navDropdown" role="menu">
            <div class="nav-dropdown-header">
              <div class="nav-dropdown-fullname">${display}</div>
              <div class="nav-dropdown-email">${user.email}</div>
            </div>
            <a href="dashboard.html" class="nav-dropdown-item" role="menuitem">
              My Dashboard
            </a>
            <a href="essay-review.html" class="nav-dropdown-item" role="menuitem">
              AI Essay Review ✦
            </a>
            <button class="nav-dropdown-item nav-dropdown-signout"
                    id="navSignOutBtn" role="menuitem">
              Sign Out
            </button>
          </div>
        </div>
      `;

      // Hide "Get Started" when signed in
      if (gsEl) gsEl.style.display = 'none';

      document.getElementById('navUserBtn').addEventListener('click', function (e) {
        e.stopPropagation();
        const dd = document.getElementById('navDropdown');
        const open = dd.classList.toggle('open');
        this.setAttribute('aria-expanded', open);
      });

      document.getElementById('navSignOutBtn').addEventListener('click', async function () {
        await sb.auth.signOut();
        window.location.href = 'index.html';
      });

      // Close on any outside click
      document.addEventListener('click', function () {
        const dd = document.getElementById('navDropdown');
        if (dd) dd.classList.remove('open');
        const btn = document.getElementById('navUserBtn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });

    } else {
      authEl.innerHTML = `<a href="login.html" class="nav-signin-btn">Sign In</a>`;
      if (gsEl) gsEl.style.display = '';
    }
  }

  // Re-render nav on any auth state change
  sb.auth.onAuthStateChange(function () {
    updateNavAuth();
  });

  // Initial render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavAuth);
  } else {
    updateNavAuth();
  }
})();
