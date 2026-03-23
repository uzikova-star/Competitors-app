/**
 * ahrefsService.ts
 * Fetches real SEO metrics from the Ahrefs API v3 for a given domain.
 *
 * In development: calls /api/ahrefs (proxied by Vite → ahrefs.com, key injected server-side).
 * In production:  calls /api/ahrefs (proxied by Vercel serverless function in api/ahrefs.ts).
 *
 * The API key is NEVER included in the client bundle or visible in browser DevTools.
 *
 * Fields used:
 *   - domain_rating      → DR score 0–100
 *   - org_keywords       → organic keywords ranking in top 100
 *   - org_traffic        → estimated monthly organic visits
 *   - org_keywords_1_3   → keywords in positions 1–3 (top visibility)
 *   - referring_domains  → unique domains linking to the site
 *   - backlinks          → total backlink count
 *   - paid_keywords      → active Google Ads keywords (ads indicator)
 *   - paid_traffic       → estimated paid traffic
 */

export interface AhrefsSeoData {
  domainRating: number | null;     // DR 0–100
  organicKeywords: number | null;  // total keywords in top 100
  organicTraffic: number | null;   // estimated monthly visits
  topKeywords: number | null;      // keywords ranking positions 1–3
  referringDomains: number | null; // unique linking domains
  backlinks: number | null;        // total backlinks
  paidKeywords: number | null;     // Google Ads keyword count
  paidTraffic: number | null;      // estimated paid traffic
  seoPositionLabel: string;        // "Vysoká" | "Stredná" | "Nízka"
}

// Separate thresholds — DR and traffic are not addable
function deriveSeoLabel(dr: number | null, traffic: number | null): string {
  const d = dr ?? 0;
  const t = traffic ?? 0;
  if (d >= 40 || t >= 10000) return "Vysoká";
  if (d >= 20 || t >= 2000)  return "Stredná";
  return "Nízka";
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Fix #1: exported so it can be called from verifyClient or any other context
export async function fetchAhrefsSeoData(websiteUrl: string): Promise<AhrefsSeoData | null> {
  const domain = extractDomain(websiteUrl);
  if (!domain) return null;

  const fields = "domain_rating,org_keywords,org_traffic,org_keywords_1_3,paid_keywords,paid_traffic,referring_domains,backlinks";
  // Relative URL — handled by Vite proxy (dev) or Vercel function (prod)
  const endpoint = `/api/ahrefs?select=${fields}&target=${encodeURIComponent(domain)}&mode=domain`;

  // Fix #5: abort if Ahrefs takes longer than 8 seconds
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      const body = await response.text();
      console.warn(`[Ahrefs] Request failed for "${domain}": ${response.status} ${body}`);
      return null;
    }

    // Fix #2: log units only after confirming response.ok
    const unitsCost = response.headers.get("x-api-units-cost-total-actual");
    if (unitsCost) {
      console.log(`[Ahrefs] Units consumed for "${domain}": ${unitsCost}`);
    }

    const json = await response.json();

    // Fix #5: guard and log on unexpected response shape
    const data = json.domain ?? json;
    if (!json.domain) {
      console.warn(
        `[Ahrefs] Unexpected response shape for "${domain}":`,
        JSON.stringify(json).slice(0, 200)
      );
    }

    const dr: number | null       = typeof data.domain_rating   === "number" ? data.domain_rating   : null;
    const keywords: number | null  = typeof data.org_keywords     === "number" ? data.org_keywords     : null;
    const traffic: number | null   = typeof data.org_traffic      === "number" ? data.org_traffic      : null;
    const topKeywords: number | null      = typeof data.org_keywords_1_3  === "number" ? data.org_keywords_1_3  : null;
    const referringDomains: number | null = typeof data.referring_domains === "number" ? data.referring_domains : null;
    const backlinks: number | null        = typeof data.backlinks          === "number" ? data.backlinks          : null;
    const paidKeywords: number | null     = typeof data.paid_keywords      === "number" ? data.paid_keywords      : null;
    const paidTraffic: number | null      = typeof data.paid_traffic       === "number" ? data.paid_traffic       : null;

    return {
      domainRating: dr,
      organicKeywords: keywords,
      organicTraffic: traffic,
      topKeywords,
      referringDomains,
      backlinks,
      paidKeywords,
      paidTraffic,
      seoPositionLabel: deriveSeoLabel(dr, traffic),
    };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      console.warn(`[Ahrefs] Request timed out for "${domain}"`);
    } else {
      console.warn(`[Ahrefs] Unexpected error for "${domain}":`, err.message);
    }
    return null;
  }
}

// Fix #4: increased to 600ms between calls — safer for a unit-charged API
const BATCH_DELAY_MS = 600;

export async function fetchAhrefsForCompetitors(
  websites: string[]
): Promise<(AhrefsSeoData | null)[]> {
  const results: (AhrefsSeoData | null)[] = [];

  for (let i = 0; i < websites.length; i++) {
    results.push(await fetchAhrefsSeoData(websites[i]));
    if (i < websites.length - 1) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return results;
}
