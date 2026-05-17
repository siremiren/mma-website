/*!
 * MMA WhatsApp Chat Widget
 * Self-contained: injects HTML, CSS, and behaviour on load.
 * To change number or messaging, edit the CONFIG object below.
 */
(function () {
  'use strict';

  var CONFIG = {
    number:  '447500015709',
    agent:   'Mind & Method',
    tagline: 'We\u2019ll reply as soon as we can',
    prefill: 'Hi, I\u2019d like to find out more about Mind and Method Academy.',
    bubbles: [
      'Hi there. Send us a quick message on WhatsApp and we\u2019ll get back to you shortly.',
      'Tap the button below to continue in WhatsApp.'
    ]
  };

  // ---- inject CSS ----
  var css = ''
    + '#mma-wa-widget{position:fixed;bottom:24px;right:24px;z-index:9999;font-family:"Lato",system-ui,-apple-system,sans-serif}'
    + '#mma-wa-launcher{display:inline-flex;align-items:center;gap:0;background:#C5A059;color:#1B263B;border:none;border-radius:999px;padding:14px;font-family:"Montserrat",sans-serif;font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 8px 24px rgba(27,38,59,.25);transition:all .2s ease;overflow:hidden}'
    + '#mma-wa-launcher #mma-wa-launcher-text{max-width:0;opacity:0;white-space:nowrap;transition:max-width .25s ease,opacity .2s ease,margin-left .25s ease}'
    + '#mma-wa-launcher:hover #mma-wa-launcher-text{max-width:200px;opacity:1;margin-left:10px}'
    + '#mma-wa-launcher:hover{padding:14px 22px 14px 18px}'
    + '#mma-wa-launcher:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgba(27,38,59,.3)}'
    + '#mma-wa-launcher:focus-visible{outline:3px solid #1B263B;outline-offset:2px}'
    + '#mma-wa-panel{position:absolute;bottom:72px;right:0;width:340px;max-width:calc(100vw - 32px);background:#FFF;border-radius:16px;overflow:hidden;box-shadow:0 20px 50px rgba(27,38,59,.25);animation:mma-wa-pop .18s ease-out}'
    + '@keyframes mma-wa-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}'
    + '#mma-wa-header{background:#C5A059;color:#FFF;padding:18px 20px;display:flex;justify-content:space-between;align-items:flex-start}'
    + '#mma-wa-agent{font-family:"Montserrat",sans-serif;font-weight:800;font-size:18px;letter-spacing:.5px;text-transform:uppercase}'
    + '#mma-wa-status{font-size:13px;opacity:.95;margin-top:4px;display:flex;align-items:center;gap:8px}'
    + '.mma-wa-dot{width:9px;height:9px;border-radius:50%;background:#25D366;display:inline-block}'
    + '#mma-wa-close{background:transparent;border:none;color:#FFF;font-size:26px;line-height:1;cursor:pointer;padding:0 4px}'
    + '#mma-wa-close:hover{opacity:.8}'
    + '#mma-wa-body{background:#F7F3EA;padding:22px 18px;min-height:180px;display:flex;flex-direction:column;gap:10px}'
    + '.mma-wa-bubble{background:#FFF;color:#1B263B;padding:12px 14px;border-radius:12px;font-size:14px;line-height:1.45;max-width:85%;align-self:flex-start;box-shadow:0 1px 2px rgba(0,0,0,.06)}'
    + '#mma-wa-footer{background:#FFF;padding:12px 14px;border-top:1px solid #EEE}'
    + '#mma-wa-cta{display:flex;align-items:center;justify-content:center;gap:8px;background:#25D366;color:#FFF;text-decoration:none;padding:12px 18px;border-radius:8px;font-family:"Montserrat",sans-serif;font-weight:700;font-size:14px}'
    + '#mma-wa-cta:hover{background:#1ebd5b}'
    + '@media (max-width:480px){#mma-wa-widget{bottom:16px;right:16px}#mma-wa-launcher-text{display:none}#mma-wa-launcher{padding:14px;gap:0}#mma-wa-panel{width:calc(100vw - 32px);right:0}}';

  var styleEl = document.createElement('style');
  styleEl.type = 'text/css';
  styleEl.appendChild(document.createTextNode(css));
  document.head.appendChild(styleEl);

  // ---- inject HTML ----
  var waIcon = '<svg viewBox="0 0 32 32" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.44 1.65 6.31L3 29l6.86-1.8A12.93 12.93 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3Zm7.43 18.36c-.31.87-1.83 1.69-2.5 1.75-.63.06-1.43.09-2.31-.15a20.91 20.91 0 0 1-2.09-.77c-3.68-1.59-6.08-5.29-6.27-5.54-.18-.25-1.5-1.99-1.5-3.8 0-1.81.95-2.7 1.29-3.07.34-.37.74-.46.99-.46s.5 0 .71.01c.23.01.54-.09.84.64.31.74 1.04 2.55 1.13 2.73.09.18.15.4.03.65-.12.25-.18.4-.37.62-.18.22-.39.49-.55.66-.18.18-.37.38-.16.74.21.37.94 1.55 2.02 2.51 1.39 1.24 2.55 1.62 2.92 1.81.37.18.59.15.81-.09.22-.25.93-1.09 1.18-1.46.25-.37.5-.31.84-.18.34.12 2.15 1.01 2.52 1.2.37.18.62.27.71.43.09.15.09.87-.22 1.74Z" fill="currentColor"/></svg>';
  var waIconSm = '<svg viewBox="0 0 32 32" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M16 3C8.82 3 3 8.82 3 16c0 2.29.6 4.44 1.65 6.31L3 29l6.86-1.8A12.93 12.93 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3Zm7.43 18.36c-.31.87-1.83 1.69-2.5 1.75-.63.06-1.43.09-2.31-.15a20.91 20.91 0 0 1-2.09-.77c-3.68-1.59-6.08-5.29-6.27-5.54-.18-.25-1.5-1.99-1.5-3.8 0-1.81.95-2.7 1.29-3.07.34-.37.74-.46.99-.46s.5 0 .71.01c.23.01.54-.09.84.64.31.74 1.04 2.55 1.13 2.73.09.18.15.4.03.65-.12.25-.18.4-.37.62-.18.22-.39.49-.55.66-.18.18-.37.38-.16.74.21.37.94 1.55 2.02 2.51 1.39 1.24 2.55 1.62 2.92 1.81.37.18.59.15.81-.09.22-.25.93-1.09 1.18-1.46.25-.37.5-.31.84-.18.34.12 2.15 1.01 2.52 1.2.37.18.62.27.71.43.09.15.09.87-.22 1.74Z" fill="currentColor"/></svg>';

  var bubblesHtml = '';
  for (var i = 0; i < CONFIG.bubbles.length; i++) {
    bubblesHtml += '<div class="mma-wa-bubble">' + CONFIG.bubbles[i] + '</div>';
  }

  var html = ''
    + '<button id="mma-wa-launcher" aria-label="Open WhatsApp chat" aria-expanded="false">'
    +   waIcon
    +   '<span id="mma-wa-launcher-text">Chat with us</span>'
    + '</button>'
    + '<div id="mma-wa-panel" role="dialog" aria-label="WhatsApp chat with Mind and Method Academy" hidden>'
    +   '<div id="mma-wa-header">'
    +     '<div>'
    +       '<div id="mma-wa-agent">' + CONFIG.agent + '</div>'
    +       '<div id="mma-wa-status"><span class="mma-wa-dot" aria-hidden="true"></span><span>' + CONFIG.tagline + '</span></div>'
    +     '</div>'
    +     '<button id="mma-wa-close" aria-label="Close chat">&times;</button>'
    +   '</div>'
    +   '<div id="mma-wa-body">' + bubblesHtml + '</div>'
    +   '<div id="mma-wa-footer">'
    +     '<a id="mma-wa-cta" target="_blank" rel="noopener noreferrer">' + waIconSm + 'Open WhatsApp</a>'
    +   '</div>'
    + '</div>';

  var container = document.createElement('div');
  container.id = 'mma-wa-widget';
  container.innerHTML = html;

  function mount() {
    document.body.appendChild(container);

    var waUrl = 'https://wa.me/' + CONFIG.number.replace(/[^0-9]/g, '') + (CONFIG.prefill ? '?text=' + encodeURIComponent(CONFIG.prefill) : '');
    document.getElementById('mma-wa-cta').setAttribute('href', waUrl);

    var launcher = document.getElementById('mma-wa-launcher');
    var panel    = document.getElementById('mma-wa-panel');
    var closeBtn = document.getElementById('mma-wa-close');

    function open()  { panel.hidden = false; launcher.setAttribute('aria-expanded', 'true'); }
    function close() { panel.hidden = true;  launcher.setAttribute('aria-expanded', 'false'); }

    launcher.addEventListener('click', function () { panel.hidden ? open() : close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
