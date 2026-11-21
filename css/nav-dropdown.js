// A disclosure beside the Programmes link keeps the hub independently accessible.
(() => {
  const item = document.querySelector('.nav-programmes');
  if (!item) return;
  const toggle = item.querySelector('.nav-submenu-toggle');
  const submenu = item.querySelector('.nav-submenu');
  const link = item.querySelector('a');
  const mobile = window.matchMedia('(max-width: 768px)');
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} Programmes submenu`);
    submenu.hidden = !open;
  };
  toggle.addEventListener('click', () => setOpen(submenu.hidden));
  item.addEventListener('pointerenter', (event) => {
    if (!mobile.matches && event.pointerType === 'mouse') setOpen(true);
  });
  item.addEventListener('pointerleave', () => {
    if (!mobile.matches && !item.contains(document.activeElement)) setOpen(false);
  });
  item.addEventListener('focusout', (event) => {
    if (!item.contains(event.relatedTarget)) setOpen(false);
  });
  item.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !submenu.hidden) {
      event.preventDefault();
      setOpen(false);
      toggle.focus();
    } else if (event.key === 'ArrowDown' && (event.target === link || event.target === toggle)) {
      event.preventDefault();
      setOpen(true);
      submenu.querySelector('a').focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!item.contains(event.target)) setOpen(false);
  });
  document.getElementById('hamburger')?.addEventListener('click', () => setOpen(false));
  mobile.addEventListener('change', () => setOpen(false));
})();
