
import { z } from 'zod';

export const CompetitorSchema = z.object({
    name: z.string(),
    website: z.string(),
    revenue: z.string().optional().or(z.literal("")),
    economicResult: z.string().optional().or(z.literal("")),
    physicalStore: z.boolean().optional().default(false),
    monthlyAdSpend: z.string().optional().or(z.literal("")),
    annualAdSpend: z.string().optional().or(z.literal("")),
    seoPosition: z.string().optional().or(z.literal("")),
    seoStrategy: z.string().optional().or(z.literal("")),
    metaAdsStatus: z.boolean().optional().default(false),
    metaAdsFocus: z.string().optional().or(z.literal("")),
    tikTokAdsStatus: z.boolean().optional().default(false),
    tikTokAdsFocus: z.string().optional().or(z.literal("")),
    tikTokAccountName: z.string().optional().or(z.literal("")),
    tikTokProfileUrl: z.string().optional().or(z.literal("")),
    googlePPC: z.boolean().optional().default(false),
    mainProducts: z.array(z.string()).optional(),
    bestSellers: z.array(z.string()).optional(),
});

export const ClientAnalysisSchema = z.object({
    name: z.string().default("N/A"),
    url: z.string().default("N/A"),
    industry: z.string().default("N/A"),
    services: z.array(z.string()).default([]),
    products: z.array(z.string()).default([]),
    topSellers: z.array(z.string()).default([]),
    targetRegion: z.string().default("N/A"),
    countryCode: z.string().default("N/A"),
});

export const CompetitorDeepDiveSchema = z.object({
    name: z.string().default("N/A"),
    theirUSPs: z.array(z.string()).default([]),
    theirShortcomings: z.array(z.string()).default([]),
});

export const USPDataSchema = z.object({
    marketStandards: z.array(z.string()).default([]),
    clientStrengths: z.array(z.string()).default([]),
    clientOpportunities: z.array(z.string()).default([]),
    competitorDeepDive: z.array(CompetitorDeepDiveSchema).default([]),
    recommendations: z.array(z.string()).default([]),
});


export const AnalysisResultSchema = z.object({
    clientAnalysis: ClientAnalysisSchema,
    topCompetitors: z.array(CompetitorSchema),
    realCompetitors: z.array(CompetitorSchema),
    uspAnalysis: USPDataSchema,
    sources: z.array(z.object({ title: z.string(), uri: z.string() })).optional(),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
