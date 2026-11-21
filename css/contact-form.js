const contactForm = document.forms.namedItem('contact');
const contactSubmit = contactForm.querySelector('[type="submit"]');
const contactError = contactForm.querySelector('.contact-form-error');
const contactEnquiry = document.getElementById('contact-enquiry');
const contactConfirmation = document.getElementById('contact-confirmation');
const contactConfirmationTitle = document.getElementById('contact-confirmation-title');

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
  } catch {
    contactError.hidden = false;
    contactSubmit.disabled = false;
    contactSubmit.focus();
    return;
  }

  contactForm.reset();
  contactSubmit.disabled = false;
  contactEnquiry.hidden = true;
  contactConfirmation.hidden = false;
  contactConfirmationTitle.focus();
});
