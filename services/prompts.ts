const getCountryTld = (country: string) => {
  const tldMap: Record<string, string> = {
    "Slovakia": "sk", "Slovensko": "sk",
    "Czech Republic": "cz", "Česko": "cz", "Czechia": "cz",
    "Germany": "de", "Nemecko": "de",
    "Austria": "at", "Rakúsko": "at",
    "Hungary": "hu", "Maďarsko": "hu",
    "Poland": "pl", "Poľsko": "pl"
  };
  return tldMap[country] ?? "com";
};

export const getIndustryGuidance = (clientUrl: string, country: string, industry: string, topProducts?: string) => {
  const countryTld = getCountryTld(country);
  return `
    PHASE 1: CLIENT PRODUCT DNA MAPPING
    First, visit and analyze ${clientUrl} to define the "Product DNA" within the context of the "${industry}" industry **SPECIFICALLY for the "${country}" market**.
    
    IMPORTANT: The user has explicitly identified the industry as "${industry}". You MUST use this as your primary lens. Even if the client website covers multiple areas, focus your analysis and competitor search on the "${industry}" segment.

    ${topProducts ? `CRITICAL PRODUCT FOCUS: The client's most prominent products are: ${topProducts}. 
    Your competitor search MUST prioritize companies that specifically lead in these areas.` : ''}

    - If the client is a multi-national company (e.g., .com, .de, .eu), you **MUST focus exclusively on their operations, product availability, and service offerings in ${country}**.
    - What are the EXACT core products/services they offer in ${country} related to "${industry}"?
    - What are their TOP SELLING or FLAGSHIP products in the ${country} market for "${industry}"?
    - What is the price segment in the local ${country} market?
    - What is the specific problem these products solve for customers in ${country}?

    **SELECTION & EXCLUSION RULES**: 
    1. **HIERARCHICAL MATCHING**:
       - **STEP 1 (Broad)**: Identify competitors within the "${industry}" industry category in ${country}.
       - **STEP 2 (Refined)**: Prioritize those who specifically lead in: ${topProducts || 'core identified products'}.
       - **OVER-NICHING GUARD**: If the specific product focus is too narrow (e.g., only one specific type), do NOT ignore larger competitors who cover the broader "${industry}" category but still compete strongly in the top product areas.
       - **MANDATORY REFINEMENT**: Competitors MUST have at least 50% overlap with the client's primary business activities in ${country}.
       
    2. **GEOGRAPHIC LOCK**: 
       - **MANDATORY**: Only include companies that are DIRECTLY COMPETING in ${country}.
       - PREFERENCE for local TLDs (e.g., .sk for Slovakia, .cz for Czechia). .com/.eu/global domains are acceptable ONLY if they have a dedicated local version, local pricing, and ship/operate in ${country}.
       - **EXCLUDE** companies that do not serve the ${country} market, even if they are global leaders in the industry.

    3. **ACTIVE DISCOVERY — MANDATORY 3-STEP PROCESS FOR EVERY COMPETITOR**:

       STEP 1 — GOOGLE SEARCH FIRST:
       For each potential competitor, start with a Google Search:
       - "[company name] ${country} oficiálna stránka"
       - "[industry] predajca ${country} site:*.${countryTld}"
       - "[topProducts] firma ${country}"
       Take the first result that is clearly the company's own homepage domain. Ignore directories, finstat, Facebook, Heureka, and aggregators.

       STEP 2 — VISIT AND VERIFY THE URL:
       Before recording any competitor, you MUST visit the URL you found and confirm:
       - The company name/logo matches what you searched for
       - Their products match the "${industry}" category
       - The site is serving ${country} customers (local language, local pricing, local contact)
       - CRITICAL: Two companies can have very similar names but be completely different businesses. Example: fenestra.sk and fenestrask.sk are two different companies. Always visit the URL to confirm which one is correct.
       If the page does not match → go back to Google and try the next result.
       If after 3 attempts no verified URL is found → SKIP this competitor entirely. Do not guess a URL.

       STEP 3 — ONLY AFTER URL IS CONFIRMED, collect all other data from that verified domain.

       **QUALITY OVER QUANTITY**:
       - Only include HIGH-QUALITY, ESTABLISHED competitors with a verified homepage URL.
       - The website field must always be the homepage (e.g. https://www.example.sk/) — never a subpage, search result, or directory listing.

    4. **PRIMARY FOCUS**: The competitor's key business should be relevant to "${industry}" and specifically to the niche the client occupies in ${country}.
    5. **MARKETPLACE HANDLING**: 
       - **AVOID** general marketplaces (Alza, Amazon, Mall) IF specialized competitors exist.
       - **INCLUDE** them ONLY if the client themselves is a general marketplace or if the niche is dominated exclusively by them in ${country}.

    6. **BUSINESS MODEL & CUSTOMER TYPE FILTER — CRITICAL**:
       The client at ${clientUrl} sells to: identify whether they sell directly to end consumers (B2C) or to businesses/contractors (B2B) by visiting their website.
       
       You MUST apply this filter to every competitor:
       - If client is B2C (sells to homeowners, individuals, families) → EXCLUDE any competitor that primarily sells to construction companies, industrial clients, large developers, or other businesses at scale.
       - If client is B2B → EXCLUDE consumer-facing retailers.
       
       CUSTOMER SCALE CHECK:
       - "Residential" = windows/doors for family homes and apartments → valid B2C competitor
       - "Commercial/Industrial" = windows/facades for office buildings, factories, airports, large developments → NOT a valid B2C competitor even if they sell the same product category
       
       Real example of what to EXCLUDE: A company that installs curtain wall facade systems for airports or supplies PVC profiles wholesale to other manufacturers is NOT a competitor to a company selling windows directly to homeowners — even if both mention "okná" on their website.

       To determine a competitor's customer type, look for:
       - Their project references/portfolio (houses vs. large buildings)
       - Their contact page (individual inquiry form vs. B2B partnership form)
       - Language used: "pre váš domov" (B2C) vs. "pre developerov / stavebné firmy" (B2B)
       - Minimum order quantities or wholesale pricing = B2B signal → EXCLUDE if client is B2C
    `;
};

export const getPrompt = (clientUrl: string, country: string, industry: string, topProducts?: string) => {
  const countryTld = getCountryTld(country);

  return `
    You are a high-end business intelligence expert specializing in the ${country} market for the "${industry}" industry.
    Client: ${clientUrl}
    Industry: ${industry}
    ${topProducts ? `Strategic Product Focus: ${topProducts}` : ''}
    Market: ${country}

    ${getIndustryGuidance(clientUrl, country, industry, topProducts)}

    Execute a detailed competitor analysis using Google Search.
    IMPORTANT: Output JSON must contain text in the primary language of ${country} (e.g., Slovak for Slovakia).

    --- STRICT GEOGRAPHIC & URL RULES (MUST FOLLOW) ---
    1. ONLY include competitors whose PRIMARY website actively serves the ${country} market.
    2. URL PRIORITY: Always prefer the local domain (.${countryTld}). If a company has both companyname.${countryTld} AND companyname.com, ALWAYS use the .${countryTld} version.
    3. NEVER include a company just because they share a name with a local one — verify they are actually operating in ${country}.
    4. All "website" values in JSON must be real, currently active URLs starting with https://. Never use directory pages, aggregators, or search result pages.
    5. If you cannot find a verified active local website for a competitor, SKIP them entirely. Do not guess.

    --- TASK: COMPETITOR ANALYSIS ---
    Search specifically for: "${industry} ${country}" and "${industry} site:*.${countryTld}"
    Find UP TO 5 Market Leaders and 5 Real Competitors operating in ${country} with verified .${countryTld} or locally-confirmed websites.
    For each competitor, verify: "Does at least 70% of their product portfolio match the client's core niche in ${industry}?"
    For each competitor, verify: "Is this website primarily serving ${country} customers?" — if not certain, exclude.

    --- TASK: TikTok Handle Discovery (STRICT PROTOCOL) ---
    For EVERY competitor identified, find their official TikTok presence:
    1. **Search Execution**: Execute Google Search for: "[Competitor Brand Name] tiktok ${country}".
    2. **Analysis**: Focus ONLY on TOP 3 results. Ignore hashtags/keywords.
    3. **Verification**: 
       - Prioritize handles with local suffixes (e.g., "sk", "cz", "skcz").
       - Cross-reference the TikTok bio link with the brand's verified local website.
    4. **Data**: Retrieve @handle and full URL. Return "Nenájdené" if not verified.

    --- DATA REQUIREMENTS ---
    - Revenue & Result: Search local Finstat/Registries/Business databases for recent financial data. 
      - For Slovakian companies (.sk or headquartered in Slovakia), MANDATORY: Go to finstat.sk and find the financial data for the company.
      - CRITICAL: You MUST use the MOST RECENT year for which data is published. Check years in this order: 2024, 2023, 2022, 2021 — use the FIRST year that has data.
      - DO NOT use 2022 or 2023 data if 2024 data is available on finstat.sk. Always prefer the newest year.
      - Extract both the tržby (revenue/turnover) amount for 'revenue' and the specific year for 'revenueYear' (e.g., '2024').
    - Physical Store: Verify if they have a physical showroom/shop.
      - Look for keywords: "Pobočka", "Pobočky", "Naše pobočky", "Predajňa", "Kamenná predajňa", "Showroom".
      - Look for: An interactive Google Map on the "Kontakt", "O nás", or standalone location page.
      - If found -> true, else -> false.
    - Ad Spend: Estimate monthly and annual ranges based on digital footprint.
    - SEO: For 'seoPosition' return one of: Vysoká / Stredná / Nízka (will be enriched with live Ahrefs data later). For 'seoStrategy' describe their approach (content, backlinks, paid, local SEO, etc.).
    - Ads: Meta Status, TikTok Ads Status, TikTok Handle, TikTok Profile URL, Google PPC status.
    - Products: 
      - Main Product Categories (Core offerings).
      - Best Sellers / Flagship Products (Specific popular items).

    --- STRATEGIC USP ANALYSIS ---
    - Client Strengths & Opportunities.
    - Competitor Deep Dive (Specific USPs & Shortcomings).
    - Actionable Recommendations.

    **Output Format:**
    Return a single, valid JSON object:
    {
      "clientAnalysis": {
        "name": "string",
        "url": "string",
        "industry": "string",
        "services": ["string"],
        "products": ["string"],
        "topSellers": ["string"],
        "targetRegion": "string",
        "countryCode": "string (ISO 2-letter code)"
      },
      "topCompetitors": [
        { 
          "name": "string", 
          "website": "string (must be active https:// URL, prefer .${countryTld} domain)", 
          "revenue": "string", 
          "revenueYear": "string (e.g., '2023', '2024')",
          "economicResult": "string", 
          "physicalStore": boolean,
          "monthlyAdSpend": "string",
          "annualAdSpend": "string",
          "seoPosition": "string", 
          "seoStrategy": "string", 
          "metaAdsStatus": boolean, 
          "metaAdsFocus": "string", 
          "tikTokAdsStatus": boolean,
          "tikTokAdsFocus": "string",
          "tikTokAccountName": "string (@handle or 'Nenájdené')",
          "tikTokProfileUrl": "string (URL or 'Nenájdené')",
          "googlePPC": boolean,
          "mainProducts": ["string"],
          "bestSellers": ["string"]
        }
      ],
      "realCompetitors": [ ... same structure as topCompetitors ... ],
      "uspAnalysis": {
        "marketStandards": ["string"],
        "clientStrengths": ["string"],
        "clientOpportunities": ["string"],
        "competitorDeepDive": [
           {
             "name": "string",
             "theirUSPs": ["string"],
             "theirShortcomings": ["string"]
           }
        ],
        "recommendations": ["string"]
      }
    }
  `;
};
export const getResearchPrompt = (clientUrl: string, country: string, industry: string, topProducts?: string) => `
    You are a high-end business intelligence expert specializing in the ${country} market for the "${industry}" industry.
    Client: ${clientUrl}
    Industry: ${industry}
    ${topProducts ? `Strategic Product Focus: ${topProducts}` : ''}
    Market: ${country}

    ${getIndustryGuidance(clientUrl, country, industry, topProducts)}
    
    Execute a detailed, deep-dive competitor analysis using Google Search.
    
    COMPETITOR DISCOVERY RULES:
    - For each competitor: first search Google for their official website, then VISIT it to confirm it is the right company.
    - Never record a URL without visiting it first. If two companies share a similar name, visit both URLs and pick the correct one.
    - EXCLUDE competitors that sell to businesses/contractors/developers at scale if the client sells directly to end consumers (B2C). Check their portfolio/references to determine this.
    - EXCLUDE any URL that is not the company's own homepage.
    
    GOAL: Gather as much factual data as possible. Do NOT worry about JSON formatting yet. Focus on finding the TRUTH.
    
    Structure your report as follows:
    1. **Client DNA**: Brief analysis of the client.
    2. **Market Leaders (Top 5)**: For each, list Name, Website, Revenue (if found), Ads status, Physical presence, and WHY they are a leader.
    3. **Real Competitors (Top 5)**: Smaller/Direct competitors.
    4. **TikTok Analysis**: For each competitor, did you find a handle? What is it?
    5. **USP Analysis**: What are the market standards? What are the gaps?

    BE DETAILED. If you find financial data, write it down explicitly. If you find a TikTok handle, write it down.
`;

export const getFormattingPrompt = () => `
    You are a Data Structuring Expert.
    Your task is to take the provided RESEARCH REPORT and convert it into a strict JSON format.
    
    Rules:
    1. Use the data exactly as provided in the report. Do not hallucinate new data (unless inferring obvious booleans).
    2. If a field is missing or unknown in the report, handle it as follows:
       - For strings: Use "N/A" (e.g., "revenue": "N/A").
       - For arrays: Use an empty array [] (e.g., "services": []).
       - For booleans: Use false as a safe default if not explicitly mentioned.
    3. IMPORTANT: Every key defined in the structure MUST be present in the output JSON.
    4. Output ONLY valid JSON.
    
    Output Format:
    {
      "clientAnalysis": { 
        "name": "string", "url": "string", "industry": "string", 
        "services": ["string"], "products": ["string"], "topSellers": ["string"],
        "targetRegion": "string", "countryCode": "string"
      },
      "topCompetitors": [ 
        { "name": "string", "website": "string", "revenue": "string", "revenueYear": "string", ... all fields from task prompt ... }
      ],
      "realCompetitors": [ ... ],
      "uspAnalysis": {
        "marketStandards": ["string"],
        "clientStrengths": ["string"],
        "clientOpportunities": ["string"],
        "competitorDeepDive": [
           { "name": "string", "theirUSPs": ["string"], "theirShortcomings": ["string"] }
        ],
        "recommendations": ["string"]
      }
    }
`;

