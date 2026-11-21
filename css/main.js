// Nav scroll
const nav=document.getElementById('nav');
if(nav){window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',window.scrollY>40)})}
// Mobile navigation takes over the viewport while open.
(() => {
  const hamburger = document.getElementById('hamburger');
  const menu = document.getElementById('navLinks');
  if (!nav || !hamburger || !menu) return;

  const mobile = window.matchMedia('(max-width: 768px)');
  const background = new Set();
  const makeInert = element => {
    if (element.hasAttribute('inert')) return;
    element.setAttribute('inert', '');
    background.add(element);
  };
  const isolateBackground = () => {
    // Walk out from the navigation, leaving the menu and its toggle operable.
    makeInert(nav.querySelector('.nav-logo'));
    for (let current = nav; current !== document.body; current = current.parentElement) {
      for (const sibling of current.parentElement.children) {
        if (sibling !== current && sibling instanceof HTMLElement) makeInert(sibling);
      }
    }
  };
  // Consent and the WhatsApp widget can mount after this script runs.
  const additions = new MutationObserver(isolateBackground);
  const isOpen = () => hamburger.getAttribute('aria-expanded') === 'true';

  const closeMenu = (focusTarget = hamburger) => {
    if (!isOpen()) return;

    additions.disconnect();
    for (const element of background) element.removeAttribute('inert');
    background.clear();
    document.documentElement.classList.remove('mobile-nav-open');
    nav.classList.remove('menu-open');
    menu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    menu.dispatchEvent(new Event('mobilemenuclose'));
    focusTarget?.focus({ preventScroll: true });
  };

  hamburger.addEventListener('click', () => {
    if (isOpen()) {
      closeMenu();
    } else if (mobile.matches) {
      hamburger.setAttribute('aria-expanded', 'true');
      nav.classList.add('menu-open');
      menu.classList.add('open');
      document.documentElement.classList.add('mobile-nav-open');
      isolateBackground();
      additions.observe(document.body, { childList: true });
      menu.scrollTop = 0;
      menu.querySelector('a[href]').focus();
    }
  });

  nav.addEventListener('keydown', event => {
    if (!isOpen() || event.defaultPrevented) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    } else if (event.key === 'Tab') {
      const links = [...menu.querySelectorAll('a[href], button')].filter(element => element.getClientRects().length);
      // The toggle comes after the links in DOM order. Wrap at those two boundaries.
      const target = event.shiftKey && document.activeElement === links[0] ? hamburger
        : !event.shiftKey && document.activeElement === hamburger ? links[0] : null;
      if (target) {
        event.preventDefault();
        target.focus();
      }
    }
  });

  mobile.addEventListener('change', () => {
    if (mobile.matches || !isOpen()) return;
    const active = document.activeElement;
    const submenu = active.closest('.nav-submenu');
    const desktopTarget = submenu ? submenu.closest('.nav-programmes').querySelector('a[href]')
      : menu.contains(active) ? active : menu.querySelector('a[href]');
    closeMenu(desktopTarget);
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a[href]')) closeMenu();
  });
  window.addEventListener('pagehide', () => closeMenu());
})();
// Content is always visible. Animate only elements approaching from below.
if ('IntersectionObserver' in window) {
  const motion = window.matchMedia('(prefers-reduced-motion: no-preference)');
  if (motion.matches) {
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          observer.unobserve(entry.target);
          if (motion.matches && entry.boundingClientRect.top >= window.innerHeight) {
            entry.target.classList.add('reveal-entering');
          }
        }
      }, { rootMargin: '0px 0px 32px 0px' });

      reveals.forEach(element => observer.observe(element));
    }
  }
}
