/*!
 * MMA Cookie Consent + GA4 Consent Mode v2
 * Measurement ID: G-VYY6ZCLYJ9
 * Compliant with UK GDPR / PECR — analytics only fire after user accepts.
 */
(function () {
  'use strict';

  var GA_ID = 'G-VYY6ZCLYJ9';
  var STORAGE_KEY = 'mma_consent_v1';

  // Initialise Google Consent Mode v2 with all-denied defaults.
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'analytics_storage': 'denied',
    'functionality_storage': 'granted',
    'security_storage': 'granted',
    'wait_for_update': 500
  });

  // Load the GA4 tag. It won't actually track until consent is granted.
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });

  // Check for an existing saved choice.
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}

  if (saved === 'granted') {
    gtag('consent', 'update', {
      'analytics_storage': 'granted',
      'ad_storage': 'granted',
      'ad_user_data': 'granted',
      'ad_personalization': 'granted'
    });
    return;
  }
  if (saved === 'denied') return;

  // No saved choice — show the banner.
  var css = ''
    + '#mma-consent{position:fixed;bottom:0;left:0;right:0;z-index:10000;background:#1B263B;color:#FFF;padding:18px 22px;display:flex;flex-wrap:wrap;align-items:center;gap:16px;justify-content:space-between;box-shadow:0 -8px 24px rgba(0,0,0,.18);font-family:"Lato",system-ui,-apple-system,sans-serif}'
    + '#mma-consent p{margin:0;font-size:14px;line-height:1.5;flex:1;min-width:240px}'
    + '#mma-consent a{color:#C5A059;text-decoration:underline}'
    + '#mma-consent .mma-consent-actions{display:flex;gap:10px;flex-wrap:wrap}'
    + '#mma-consent button{font-family:"Montserrat",sans-serif;font-weight:700;font-size:13px;letter-spacing:.04em;text-transform:uppercase;padding:10px 18px;border-radius:4px;cursor:pointer;border:1px solid transparent}'
    + '#mma-consent-accept{background:#C5A059;color:#1B263B}'
    + '#mma-consent-reject{background:transparent;color:#FFF;border-color:rgba(255,255,255,.4)}'
    + '#mma-consent-accept:hover{background:#D4B577}'
    + '#mma-consent-reject:hover{border-color:#FFF}';
  var styleEl = document.createElement('style');
  styleEl.appendChild(document.createTextNode(css));
  document.head.appendChild(styleEl);

  function buildBanner() {
    var banner = document.createElement('div');
    banner.id = 'mma-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookie consent');
    banner.innerHTML = ''
      + '<p>We use cookies to understand how the site is used so we can keep improving it. You can accept or reject — your choice is remembered. See our <a href="/cookies/">Cookie Policy</a>.</p>'
      + '<div class="mma-consent-actions">'
      +   '<button id="mma-consent-reject" type="button">Reject</button>'
      +   '<button id="mma-consent-accept" type="button">Accept</button>'
      + '</div>';
    document.body.appendChild(banner);

    document.getElementById('mma-consent-accept').addEventListener('click', function () {
      try { localStorage.setItem(STORAGE_KEY, 'granted'); } catch (e) {}
      gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted'
      });
      banner.remove();
    });
    document.getElementById('mma-consent-reject').addEventListener('click', function () {
      try { localStorage.setItem(STORAGE_KEY, 'denied'); } catch (e) {}
      banner.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildBanner);
  } else {
    buildBanner();
  }
})();
