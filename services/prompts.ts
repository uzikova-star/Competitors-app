
export const getIndustryGuidance = (clientUrl: string, country: string, industry: string) => `
    PHASE 1: CLIENT PRODUCT DNA MAPPING
    First, visit and analyze ${clientUrl} to define the "Product DNA" within the context of the "${industry}" industry **SPECIFICALLY for the "${country}" market**.
    - If the client is a multi-national company (e.g., .com, .de, .eu), you **MUST focus exclusively on their operations, product availability, and service offerings in ${country}**.
    - What are the EXACT core products/services they offer in ${country}?
    - What are their TOP SELLING or FLAGSHIP products in the ${country} market?
    - What is the price segment in the local ${country} market?
    - What is the specific problem these products solve for customers in ${country}?

    **SELECTION & EXCLUSION RULES**: 
    1. **PRODUCT MATCH PRIORITY**:
       - **PRIORITIZE** companies that sell the EXACT same product types within the specified industry: "${industry}" and category identified in Phase 1.
       - **FALLBACK**: If exact matches are scarce, include competitors with OVERLAPPING product lines (at least 50% match) that target the same customer segment in ${country}.
       
    2. **GEOGRAPHIC LOCK**: 
       - **MANDATORY**: Only include companies that are DIRECTLY COMPETING in ${country}.
       - PREFERENCE for local TLDs (e.g., .sk for Slovakia, .cz for Czechia). .com/.eu/global domains are acceptable ONLY if they have a dedicated local version, local pricing, and ship/operate in ${country}.
       - **EXCLUDE** companies that do not serve the ${country} market, even if they are global leaders in the industry.

    3. **ACTIVE DISCOVERY**: 
       - **MANDATORY**: Use Google Search to find the official website for each potential competitor in ${country}.
       - **MULTIPLE ITERATIONS REQUIRED**: 
         - Search in the local language of ${country} (if applicable).
         - Try queries like: "najlepší e-shop s [product] ${country}", "predajca [product] ${country}", "[industry] firmy ${country}".
         - Look for "specialized local e-shops" and "dedicated local brands".
       - **QUALITY OVER QUANTITY**:
         - **PRIORITY**: Only include HIGH-QUALITY, ESTABLISHED competitors.
         - **Market Leaders**: Modern website, strong local market presence.
         - **Real Competitors**: Credible, active business competing for the same local customers.
       
       - **BROKEN LINKS CHECK**: 
         - **MANDATORY URL VERIFICATION**: Attempt to verify each competitor's website is active and serves ${country}.

    4. **PRIMARY FOCUS**: The competitor's key business should be relevant to "${industry}" and specifically to the niche the client occupies in ${country}.
    5. **MARKETPLACE HANDLING**: 
       - **AVOID** general marketplaces (Alza, Amazon, Mall) IF specialized competitors exist.
       - **INCLUDE** them ONLY if the client themselves is a general marketplace or if the niche is dominated exclusively by them in ${country}.
`;

export const getPrompt = (clientUrl: string, country: string, industry: string) => `
    You are a high-end business intelligence expert specializing in the ${country} market for the "${industry}" industry.
    Client: ${clientUrl}
    Industry: ${industry}
    Market: ${country}

    ${getIndustryGuidance(clientUrl, country, industry)}
    
    Execute a detailed competitor analysis using Google Search.
    IMPORTANT: Output JSON must contain text in the primary language of ${country} (e.g., Slovak for Slovakia).

    --- TASK: COMPETITOR ANALYSIS ---
    Find UP TO 5 Market Leaders and 5 Real Competitors who pass the STRICT PRODUCT MATCH and GEOGRAPHIC LOCK filters within the "${industry}" niche.
    For each competitor, verify: "Does at least 70% of their product portfolio match the client's core niche in ${industry}?"

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
    - Physical Store: Verify if they have a physical showroom/shop.
      - Look for keywords: "Pobočka", "Pobočky", "Naše pobočky", "Predajňa", "Kamenná predajňa", "Showroom".
      - Look for: An interactive Google Map on the "Kontakt", "O nás", or standalone location page.
      - If found -> true, else -> false.
    - Ad Spend: Estimate monthly and annual ranges based on digital footprint.
    - SEO: Evaluate strategy and position (Vysoká/Stredná/Nízka).
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
          "website": "string", 
          "revenue": "string", 
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

export const getResearchPrompt = (clientUrl: string, country: string, industry: string) => `
    You are a high-end business intelligence expert specializing in the ${country} market for the "${industry}" industry.
    Client: ${clientUrl}
    Industry: ${industry}
    Market: ${country}

    ${getIndustryGuidance(clientUrl, country, industry)}
    
    Execute a detailed, deep-dive competitor analysis using Google Search.
    
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
        { "name": "string", "website": "string", ... all fields from task prompt ... }
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

