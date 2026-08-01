import { z } from 'zod';

// https://github.com/superfaktura/docs/blob/master/value-lists.md#language-list
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
