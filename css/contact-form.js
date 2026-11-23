const contactForm = document.forms.namedItem('contact');
const contactSubmit = contactForm.querySelector('[type="submit"]');
const contactError = contactForm.querySelector('.contact-form-error');
const contactEnquiry = document.getElementById('contact-enquiry');
const contactConfirmation = document.getElementById('contact-confirmation');
const contactConfirmationTitle = document.getElementById('contact-confirmation-title');

// The form carries a hash. The capability used to claim it stays in this page.
async function addReceiptField(fields, analytics, consent) {
  if (!consent) return null;
  try {
    const nonce = crypto.randomUUID().replaceAll('-', '');
    const issued = Date.now();
    const token = `${issued}.${nonce}`;
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    if (analytics.getConsent() !== consent) return null;
    const digest = Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
    fields.set('analytics_receipt', `${issued}.${digest}`);
    return token;
  } catch {
    return null;
  }
}

async function trackVerifiedContact(analytics, consent, token) {
  if (analytics.getConsent() !== consent) return;
  const lookup = new AbortController();
  let wake;
  const abort = () => { lookup.abort(); wake?.(); };
  consent.addEventListener('abort', abort, { once: true });
  window.addEventListener('pagehide', abort, { once: true });
  const deadline = setTimeout(abort, 30_000);
  try {
    for (const delay of [0, 1000, 2000, 4000, 8000, 14000]) {
      if (delay) {
        await new Promise(resolve => {
          const timer = setTimeout(resolve, delay);
          wake = () => { clearTimeout(timer); resolve(); };
        });
        wake = null;
      }
      if (lookup.signal.aborted || analytics.getConsent() !== consent) return;
      const response = await fetch('/.netlify/functions/contact-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: token,
        signal: lookup.signal,
        cache: 'no-store'
      });
      if (response.ok && (await response.json()).verified === true) {
        if (!lookup.signal.aborted) analytics.lead(consent);
        return;
      }
      if (response.status !== 404 && response.status !== 503) return;
    }
  } catch {
    // Receipt failures leave the enquiry and its confirmation alone.
  } finally {
    clearTimeout(deadline);
    consent.removeEventListener('abort', abort);
    window.removeEventListener('pagehide', abort);
  }
}

contactForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (contactSubmit.disabled) return;

  contactSubmit.disabled = true;
  contactError.hidden = true;
  const analytics = window.mmaEnquiryAnalytics;
  const consent = analytics?.getConsent();
  let token;
  try {
    const fields = new URLSearchParams(new FormData(contactForm));
    fields.delete('analytics_receipt');
    token = consent ? await addReceiptField(fields, analytics, consent) : null;
    const response = await fetch(contactForm.action, {
      method: contactForm.method,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: fields
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
  if (token) void trackVerifiedContact(analytics, consent, token);
});
