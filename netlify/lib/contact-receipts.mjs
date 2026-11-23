import { createHash } from 'node:crypto';
import { connectLambda, getStore } from '@netlify/blobs';

const lifetime = 120_000;
const clockSkew = 15_000;
const fieldPattern = /^(\d{13})\.([a-f0-9]{64})$/;
const tokenPattern = /^(\d{13})\.[a-f0-9]{32}$/;

export function receiptStore(options) {
  return getStore({ name: 'contact-receipts', ...(options || {}) });
}

function receiptKey(field) {
  const parts = typeof field === 'string' && field.match(fieldPattern);
  if (!parts) return null;
  const issued = Number(parts[1]);
  const now = Date.now();
  if (issued > now + clockSkew || issued + lifetime <= now) return null;
  return `${issued + lifetime}/${parts[2]}`;
}

// Only called by Netlify's signed submission-created event handler.
export async function recordVerifiedReceipt(submission, event) {
  const key = receiptKey(submission.data?.analytics_receipt);
  if (!key || submission.form_name !== 'contact' || submission.data?.['bot-field']) return;
  if (!globalThis.netlifyBlobsContext && !process.env.NETLIFY_BLOBS_CONTEXT && event.blobs) connectLambda(event);
  await receiptStore().set(key, 'verified', { onlyIfNew: true });
}

export async function claimReceipt(token) {
  const parts = token.match(tokenPattern);
  if (!parts) return false;
  const digest = createHash('sha256').update(token).digest('hex');
  const field = `${parts[1]}.${digest}`;
  const key = receiptKey(field);
  if (!key) return false;

  const store = receiptStore({ consistency: 'strong' });
  const receipt = await store.getWithMetadata(key, { type: 'text' });
  if (receipt?.data !== 'verified' || !receipt.etag || !receiptKey(field)) return false;
  const claim = await store.set(key, 'claimed', { onlyIfMatch: receipt.etag });
  return claim.modified;
}
