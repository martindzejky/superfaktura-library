import type { createClient } from '../client/create-client';

export type OutputFormat = 'text' | 'json';

export interface CliContext {
  output: OutputFormat;
}

export interface GlobalCliOptions {
  output?: OutputFormat;
  apiEmail?: string;
  apiKey?: string;
  companyId?: number;
  baseUrl?: string;
}

export interface RuntimeContext {
  output: OutputFormat;
  client: ReturnType<typeof createClient>;
}
