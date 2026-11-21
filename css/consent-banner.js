/*!
 * MMA analytics-only basic consent: no Google tag until affirmative permission.
 * Measurement ID: G-VYY6ZCLYJ9
 */
(function () {
  'use strict';

  var GA_ID = 'G-VYY6ZCLYJ9';
  var STORAGE_KEY = 'mma_consent_v2';
  var VERSION = 2;
  // Provisional renewal interval for owner/privacy review; not a retention policy.
  var MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  var loaded = false;
  var tag = null;
  var panel, settings;
  var returnFocus = null;
  var storage = null;
  window['ga-disable-' + GA_ID] = true;

  // A readable but unwritable store cannot reliably retain a withdrawal.
  try {
    var probe = STORAGE_KEY + '_check';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    storage = window.localStorage;
  } catch (_) {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
  }

  function save(choice, source) {
    var now = Date.now();
    var record = {version: VERSION, analytics: choice, source: source || 'visitor', decidedAt: now, expiresAt: now + MAX_AGE};
    try {
      if (storage) storage.setItem(STORAGE_KEY, JSON.stringify(record));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // Do not leave an older grant behind if a new decision cannot be stored.
      try { storage.removeItem(STORAGE_KEY); } catch (_) {}
      storage = null;
    }
  }

  function readChoice() {
    if (!storage) return null;
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (raw !== null) {
        var record = JSON.parse(raw);
        var now = Date.now();
        if (record && record.version === VERSION &&
            (record.analytics === 'granted' || record.analytics === 'denied') &&
            Number.isFinite(record.decidedAt) && Number.isFinite(record.expiresAt) &&
            record.decidedAt > 0 && record.decidedAt <= now &&
            record.expiresAt > now && record.expiresAt > record.decidedAt &&
            record.expiresAt - record.decidedAt <= MAX_AGE) return record.analytics;
        return null;
      }
      // Only a legacy rejection migrates. Bundled v1 grants need renewed consent.
      if (storage.getItem('mma_consent_v1') === 'denied') {
        save('denied', 'legacy-rejection');
        return 'denied';
      }
    } catch (_) {}
    return null;
  }

  function clearAnalyticsCookies() {
    // Best effort: visible first-party cookies, current/ancestor paths and domains.
    // HttpOnly cookies and cookies on other origins are inaccessible to page JS.
    var domains = [''];
    var parts = window.location.hostname.split('.');
    for (var i = 0; i < parts.length; i++) domains.push(parts.slice(i).join('.'));
    var paths = ['/'];
    var segments = window.location.pathname.split('/').filter(Boolean);
    var path = '';
    segments.forEach(function (segment) { path += '/' + segment; paths.push(path, path + '/'); });
    var cookies;
    try { cookies = document.cookie.split(';'); } catch (_) { return; }
    cookies.forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$)|_gac_)/.test(name)) return;
      domains.forEach(function (domain) {
        paths.forEach(function (cookiePath) {
          try {
            document.cookie = name + '=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=' + cookiePath +
              (domain ? '; domain=' + domain : '') + '; SameSite=Lax';
          } catch (_) {}
        });
      });
    });
  }

  function startAnalytics() {
    if (window.location.hostname !== 'mindandmethodacademy.com') return;
    if (loaded) {
      // An existing tag may have been disabled by withdrawal in another tab.
      window['ga-disable-' + GA_ID] = false;
      window.gtag = function () { window.dataLayer.push(arguments); };
      return;
    }
    loaded = true;
    window['ga-disable-' + GA_ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false
    });
    tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(tag);
  }

  function stopAnalytics(reload) {
    // No consent-update ping. Only an explicitly confirmed action may reload.
    window['ga-disable-' + GA_ID] = true;
    window.gtag = function () {};
    // Keep an already-initialising tag disabled on passive withdrawal. A later
    // affirmative choice can resume it without duplicate loaders or lost config.
    if (reload) {
      if (window.dataLayer) window.dataLayer.length = 0;
      if (tag) tag.remove();
    }
    clearAnalyticsCookies();
    if (reload) window.location.reload();
  }

  var choice = readChoice();
  if (choice === 'granted') startAnalytics();
  else clearAnalyticsCookies();

  function buildPreferences() {
    var footer = document.querySelector('.footer-inner');
    var links = document.querySelector('.footer-bottom-links');
    // Use a cookie-only footer on pages without the standard footer.
    if (!footer || !links) {
      footer = document.createElement('footer');
      footer.className = 'mma-cookie-footer';
      footer.setAttribute('aria-label', 'Cookie preferences');
      document.body.appendChild(footer);
      links = footer;
    }
    settings = document.createElement('button');
    settings.type = 'button';
    settings.id = 'mma-cookie-settings';
    settings.textContent = 'Cookie settings';
    settings.setAttribute('aria-controls', 'mma-consent');
    settings.setAttribute('aria-expanded', String(!panel.hidden));
    links.classList.add('mma-cookie-links');
    // Keep settings clear of the existing bottom-right WhatsApp launcher.
    links.insertBefore(settings, links.firstChild);

    settings.addEventListener('click', function () {
      returnFocus = settings;
      panel.hidden = false;
      settings.setAttribute('aria-expanded', 'true');
      document.getElementById('mma-consent-reject').focus();
      panel.scrollIntoView({block: 'start'});
    });
  }

  function mountPanel() {
    panel = document.createElement('section');
    panel.id = 'mma-consent';
    panel.setAttribute('aria-label', 'Analytics cookie preferences');
    panel.hidden = !!choice;
    // Provisional analytics-only microcopy for editorial review.
    panel.innerHTML = '<p tabindex="0">We use optional analytics cookies to understand how people use our website and improve it. You can accept or reject them, and change your choice at any time using Cookie settings. Read our <a href="/cookies/">Cookie Policy</a>.</p>' +
      '<div class="mma-consent-actions"><button id="mma-consent-reject" type="button">Reject</button>' +
      '<button id="mma-consent-accept" type="button">Accept</button>' +
      '<button id="mma-consent-close" type="button">Close</button></div>';
    // The parser executes this at the slot before parsing the main content.
    var slot = document.currentScript;
    var skipLink = !document.querySelector('header') && document.querySelector('.skip-link');
    (skipLink || slot).before(panel);

    function close() {
      panel.hidden = true;
      if (settings) settings.setAttribute('aria-expanded', 'false');
      var target = returnFocus || document.querySelector('main h1, main') || settings;
      if (target) {
        if (!returnFocus) target.setAttribute('tabindex', '-1');
        target.focus({preventScroll: !returnFocus});
      }
      returnFocus = null;
    }
    document.getElementById('mma-consent-accept').addEventListener('click', function () {
      choice = 'granted'; save(choice); startAnalytics(); close();
    });
    document.getElementById('mma-consent-reject').addEventListener('click', function () {
      // Cancel must leave both the stored grant and unsaved form fields intact.
      var active = loaded && !window['ga-disable-' + GA_ID];
      if (active && !window.confirm('Turning off analytics will reload this page. Unsaved answers or form entries may be lost. Turn off analytics and reload?')) return;
      choice = 'denied'; save(choice);
      if (active) stopAnalytics(true);
      else { clearAnalyticsCookies(); close(); }
    });
    document.getElementById('mma-consent-close').addEventListener('click', close);
    panel.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') { event.preventDefault(); close(); }
    });
  }

  // Honour withdrawal in another tab as well as this page's own settings.
  window.addEventListener('storage', function (event) {
    if (event.key === STORAGE_KEY || event.key === null) {
      choice = readChoice();
      if (loaded && choice !== 'granted') stopAnalytics(false);
    }
  });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted && loaded && readChoice() !== 'granted') stopAnalytics(false);
  });
  mountPanel();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildPreferences);
  else buildPreferences();
})();
