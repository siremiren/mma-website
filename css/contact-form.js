const contactForm = document.forms.namedItem('contact');
const contactSubmit = contactForm.querySelector('[type="submit"]');
const contactError = contactForm.querySelector('.contact-form-error');

contactForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (contactSubmit.disabled) return;

  contactSubmit.disabled = true;
  contactError.hidden = true;
  try {
    const response = await fetch(contactForm.action, {
      method: contactForm.method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(contactForm))
    });
    if (!response.ok) throw new Error('Netlify Forms returned an unsuccessful response');
    window.location.assign(contactForm.action);
  } catch {
    contactError.hidden = false;
    contactSubmit.disabled = false;
    contactSubmit.focus();
  }
});

// Re-enable the button if the visitor returns via browser history.
window.addEventListener('pageshow', () => { contactSubmit.disabled = false; });
