/**
 * api/ahrefs.ts — Vercel Serverless Function
 *
 * Proxies requests to the Ahrefs API v3, injecting the Bearer token
 * from the AHREFS_API_KEY environment variable (set in Vercel dashboard).
 *
 * Client calls: /api/ahrefs?select=...&target=...&mode=domain
 * This function calls: https://api.ahrefs.com/v3/site-explorer/overview?...
 *
 * The API key is NEVER sent to the browser.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const AHREFS_BASE = 'https://api.ahrefs.com/v3';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = process.env.AHREFS_API_KEY;

  if (!apiKey || apiKey === 'your_ahrefs_api_key_here') {
    return res.status(503).json({ error: 'Ahrefs API key not configured on server.' });
  }

  // Reconstruct the full Ahrefs endpoint from the incoming query string
  const queryParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.query)) {
    queryParams[k] = Array.isArray(v) ? v[0] ?? "" : v ?? "";
  }
  const qs = new URLSearchParams(queryParams).toString();
  const upstream = `${AHREFS_BASE}/site-explorer/overview${qs ? `?${qs}` : ''}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const upstreamResponse = await fetch(upstream, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // Forward cost header to client so it can log consumption
    const unitsCost = upstreamResponse.headers.get('x-api-units-cost-total-actual');
    if (unitsCost) res.setHeader('x-api-units-cost-total-actual', unitsCost);

    const body = await upstreamResponse.json();
    return res.status(upstreamResponse.status).json(body);
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    return res.status(isTimeout ? 504 : 502).json({
      error: isTimeout ? 'Ahrefs request timed out.' : `Proxy error: ${err.message}`,
    });
  }
}