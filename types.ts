
import { z } from 'zod';
import {
  CompetitorSchema,
  ClientAnalysisSchema,
  CompetitorDeepDiveSchema,
  USPDataSchema,
  AnalysisResultSchema
} from './services/validation';

export type Competitor = z.infer<typeof CompetitorSchema>;
export type ClientAnalysis = z.infer<typeof ClientAnalysisSchema>;
export type CompetitorDeepDive = z.infer<typeof CompetitorDeepDiveSchema>;
export type USPData = z.infer<typeof USPDataSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export type AppStatus = 'idle' | 'analyzing' | 'complete' | 'error';
