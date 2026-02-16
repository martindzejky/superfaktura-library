import { DEFAULT_MODULE_NAME } from './constants';

interface AuthHeaderInput {
  apiEmail: string;
  apiKey: string;
  companyId?: number;
}

export function createAuthHeader(input: AuthHeaderInput): string {
  const params = new URLSearchParams({
    email: input.apiEmail,
    apikey: input.apiKey,
    module: DEFAULT_MODULE_NAME,
  });

  if (input.companyId !== undefined) {
    params.set('company_id', String(input.companyId));
  }

  return `SFAPI ${params.toString()}`;
}
