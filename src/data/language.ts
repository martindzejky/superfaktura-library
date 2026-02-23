import { z } from 'zod';

export const LanguageSchema = z.enum([
  'cze',
  'deu',
  'eng',
  'hrv',
  'hun',
  'ita',
  'nld',
  'pol',
  'rom',
  'rus',
  'slo',
  'slv',
  'spa',
  'ukr',
]);

export type Language = z.infer<typeof LanguageSchema>;
