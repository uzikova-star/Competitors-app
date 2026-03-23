
import { CompetitorSchema } from './services/validation';

const mockCompetitor = (data: any) => {
    try {
        const result = CompetitorSchema.parse({
            name: "Test",
            website: "test.com",
            ...data
        });
        console.log(`Input: ${JSON.stringify(data)} -> isVerified: ${result.isVerified}`);
    } catch (e: any) {
        console.error("Validation error:", e.message);
    }
};

console.log("--- Testing Competitor Verification Logic ---");

// Case 1: All zero/false (Should be false)
mockCompetitor({
    seoDR: 0,
    seoTraffic: 0,
    metaAdsStatus: false,
    googlePPC: false,
    tikTokAdsStatus: false
});

// Case 2: One SEO signal present (Should be true)
mockCompetitor({
    seoDR: 10,
    seoTraffic: 0,
    metaAdsStatus: false,
    googlePPC: false,
    tikTokAdsStatus: false
});

// Case 3: One Ads signal present (Should be true)
mockCompetitor({
    seoDR: 0,
    seoTraffic: 0,
    metaAdsStatus: true,
    googlePPC: false,
    tikTokAdsStatus: false
});

// Case 4: Null SEO signals (Should be false if all false)
mockCompetitor({
    seoDR: null,
    seoTraffic: null,
    metaAdsStatus: false,
    googlePPC: false,
    tikTokAdsStatus: false
});

// Case 5: Partial signals (Should be true)
mockCompetitor({
    seoDR: null,
    seoTraffic: 100,
    metaAdsStatus: false,
    googlePPC: true,
    tikTokAdsStatus: false
});
