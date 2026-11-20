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
    // Business Plan and 404 have no Academy footer; add a cookie-only footer.
    if (!footer || !links) {
      footer = document.createElement('footer');
      footer.className = 'mma-cookie-footer';
      footer.setAttribute('aria-label', 'Cookie preferences');
      document.body.appendChild(footer);
      links = footer;
    }
    var style = document.createElement('style');
    style.textContent =
      '.mma-cookie-links{flex-wrap:wrap;align-items:center}' +
      '.mma-cookie-footer{padding:18px 96px 24px 32px;background:#1B263B;color:#FFF;font-family:"Lato",system-ui,sans-serif}' +
      '#mma-cookie-settings{font:inherit;color:rgba(255,255,255,.85);background:none;border:0;padding:10px 0;min-height:44px;cursor:pointer;text-decoration:underline}' +
      '#mma-consent{background:#1B263B;color:#FFF;margin-top:80px;padding:18px 22px;display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-rows:minmax(0,1fr);align-items:center;gap:16px;font-family:"Lato",system-ui,sans-serif;scroll-margin-top:80px;max-height:calc(var(--contact-visible-height,100dvh) - var(--contact-dock-height,0px) - 80px);box-sizing:border-box}' +
      '#mma-consent[hidden]{display:none}' +
      'body:has(#mma-consent:not([hidden])) .nav--transparent:not(.scrolled){background:#1B263B}' +
      '#mma-consent p{margin:0;font-size:14px;line-height:1.5;min-width:0;min-height:0;max-height:100%;overflow-y:auto}' +
      '#mma-consent a{color:#C5A059;text-decoration:underline}' +
      '#mma-consent .mma-consent-actions{display:flex;gap:10px;flex-wrap:wrap}' +
      '#mma-consent button{font-family:"Montserrat",sans-serif;font-weight:700;font-size:13px;letter-spacing:.04em;text-transform:uppercase;padding:10px 18px;min-height:44px;border-radius:4px;cursor:pointer;border:1px solid rgba(255,255,255,.4);background:transparent;color:#FFF}' +
      '#mma-consent #mma-consent-accept{background:#C5A059;color:#1B263B;border-color:#C5A059}' +
      '#mma-consent #mma-consent-accept:hover{background:#D4B577}' +
      '#mma-consent button:hover{border-color:#FFF}' +
      '#mma-cookie-settings:focus-visible,#mma-consent button:focus-visible,#mma-consent a:focus-visible,#mma-consent p:focus-visible{outline:2px solid #FFF;outline-offset:4px}' +
      '@media(max-width:768px){#mma-consent{grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto}}' +
      '@media print{#mma-cookie-settings,#mma-consent,.mma-cookie-footer{display:none!important}}';
    document.head.appendChild(style);

    settings = document.createElement('button');
    settings.type = 'button';
    settings.id = 'mma-cookie-settings';
    settings.textContent = 'Cookie settings';
    settings.setAttribute('aria-controls', 'mma-consent');
    settings.setAttribute('aria-expanded', String(!choice));
    links.classList.add('mma-cookie-links');
    // Keep settings clear of the existing bottom-right WhatsApp launcher.
    links.insertBefore(settings, links.firstChild);

    panel = document.createElement('section');
    panel.id = 'mma-consent';
    panel.setAttribute('aria-label', 'Analytics cookie preferences');
    panel.hidden = !!choice;
    // Provisional analytics-only microcopy for editorial review.
    panel.innerHTML = '<p tabindex="0">We use optional analytics cookies to understand how people use our website and improve it. You can accept or reject them, and change your choice at any time using Cookie settings. Read our <a href="/cookies/">Cookie Policy</a>.</p>' +
      '<div class="mma-consent-actions"><button id="mma-consent-reject" type="button">Reject</button>' +
      '<button id="mma-consent-accept" type="button">Accept</button>' +
      '<button id="mma-consent-close" type="button">Close</button></div>';
    // On-arrival strip in normal flow: navigation stays above; forms stay below.
    var header = document.querySelector('header');
    if (header) header.insertAdjacentElement('afterend', panel);
    else document.body.insertBefore(panel, document.body.firstChild);

    function close() {
      panel.hidden = true;
      settings.setAttribute('aria-expanded', 'false');
      var target = returnFocus || document.querySelector('main h1, main') || settings;
      if (!returnFocus) target.setAttribute('tabindex', '-1');
      target.focus({preventScroll: !returnFocus});
      returnFocus = null;
    }
    settings.addEventListener('click', function () {
      returnFocus = settings;
      panel.hidden = false;
      settings.setAttribute('aria-expanded', 'true');
      document.getElementById('mma-consent-reject').focus();
      panel.scrollIntoView({block: 'start'});
    });
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildPreferences);
  else buildPreferences();
})();
