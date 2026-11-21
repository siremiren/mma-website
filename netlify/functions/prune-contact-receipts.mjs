import { receiptStore } from '../lib/contact-receipts.mjs';

export const config = { schedule: '@daily' };

export default async function pruneContactReceipts() {
  const store = receiptStore();
  const now = Date.now();
  for await (const { blobs } of store.list({ paginate: true })) {
    const expired = blobs.filter(({ key }) => Number(key.split('/', 1)[0]) <= now);
    for (let start = 0; start < expired.length; start += 25) {
      await Promise.all(expired.slice(start, start + 25).map(({ key }) => store.delete(key)));
    }
  }
}
