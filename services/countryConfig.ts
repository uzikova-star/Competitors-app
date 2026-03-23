/**
 * countryConfig.ts
 * Country-scoped search configuration for competitor analysis.
 */

interface CountryEntry {
  tld: string;   // e.g. ".sk"
  lang: string;  // BCP-47 language code, e.g. "sk"
  gl: string;    // Google country code, e.g. "sk"
  cr: string;    // Google cr param, e.g. "countrysk"
}

export const COUNTRY_CONFIG: Record<string, CountryEntry> = {
  "Slovensko":        { tld: ".sk", lang: "sk", gl: "sk", cr: "countrysk" },
  "Slovakia":         { tld: ".sk", lang: "sk", gl: "sk", cr: "countrysk" },
  "Česko":            { tld: ".cz", lang: "cs", gl: "cz", cr: "countrycz" },
  "Czechia":          { tld: ".cz", lang: "cs", gl: "cz", cr: "countrycz" },
  "Czech Republic":   { tld: ".cz", lang: "cs", gl: "cz", cr: "countrycz" },
  "Nemecko":          { tld: ".de", lang: "de", gl: "de", cr: "countryde" },
  "Germany":          { tld: ".de", lang: "de", gl: "de", cr: "countryde" },
  "Rakúsko":          { tld: ".at", lang: "de", gl: "at", cr: "countryat" },
  "Austria":          { tld: ".at", lang: "de", gl: "at", cr: "countryat" },
  "Maďarsko":         { tld: ".hu", lang: "hu", gl: "hu", cr: "countryhu" },
  "Hungary":          { tld: ".hu", lang: "hu", gl: "hu", cr: "countryhu" },
  "Poľsko":           { tld: ".pl", lang: "pl", gl: "pl", cr: "countrypl" },
  "Poland":           { tld: ".pl", lang: "pl", gl: "pl", cr: "countrypl" },
};

/**
 * Builds a country-scoped Google search query for a given client URL.
 *
 * - If the domain already ends with the country TLD → returns `site:domain`
 *   (e.g. "site:example.sk")
 * - Otherwise → returns `domain site:*.sk ${country}` to scope results
 *   to the target country even for .com/.eu domains.
 */
export function buildCountryScopedQuery(clientUrl: string, country: string): string {
  let domain = clientUrl;
  try {
    const parsed = new URL(clientUrl.startsWith("http") ? clientUrl : `https://${clientUrl}`);
    domain = parsed.hostname.replace(/^www\./, "");
  } catch {
    // keep original if URL parse fails
  }

  const config = COUNTRY_CONFIG[country.trim()];
  if (!config) return `site:${domain}`;

  if (domain.endsWith(config.tld)) {
    return `site:${domain}`;
  }

  return `${domain} site:*${config.tld} ${country}`;
}

/**
 * Returns { lang, cr } for the given country name, for use in Gemini
 * generateContent's searchConfig. Defaults to English/US if not found.
 */
export function getCountrySearchConfig(country: string): { lang: string; cr: string } {
  const config = COUNTRY_CONFIG[country.trim()];
  return config
    ? { lang: config.lang, cr: config.cr }
    : { lang: "en", cr: "countryus" };
}
