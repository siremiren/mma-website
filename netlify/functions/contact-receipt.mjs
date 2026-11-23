import { claimReceipt } from '../lib/contact-receipts.mjs';

const headers = { 'Cache-Control': 'no-store' };

export default async function contactReceipt(request) {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { ...headers, Allow: 'POST' } });
  }
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return new Response(null, { status: 403, headers });
  }
  if (request.headers.get('content-type')?.split(';')[0] !== 'text/plain' ||
      Number(request.headers.get('content-length')) > 46) {
    return new Response(null, { status: 400, headers });
  }
  try {
    const token = await request.text();
    if (token.length !== 46) return new Response(null, { status: 400, headers });
    if (await claimReceipt(token)) return Response.json({ verified: true }, { headers });
    return new Response(null, { status: 404, headers });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
