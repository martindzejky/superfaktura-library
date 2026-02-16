import { config as loadDotEnv } from 'dotenv';
import { createAuthHeader } from '../core/auth-header';
import { DEFAULT_BASE_URL } from '../core/constants';
import { HttpClient } from '../core/http-client';
import { ContactsApiImpl } from '../resources/contacts-api';
import { InvoicesApiImpl } from '../resources/invoices-api';
import type { ClientConfig } from '../types';
import { parseCompanyId } from '../utils';

const DEFAULT_TIMEOUT_MS = 15_000;

export function createClient(config: ClientConfig = {}) {
  loadDotEnv({ quiet: true });

  const apiEmail = config.apiEmail ?? process.env.SUPERFAKTURA_API_EMAIL;
  const apiKey = config.apiKey ?? process.env.SUPERFAKTURA_API_KEY;
  const baseUrl = config.baseUrl ?? process.env.SUPERFAKTURA_API_URL ?? DEFAULT_BASE_URL;
  const companyId = parseCompanyId(config.companyId ?? process.env.SUPERFAKTURA_API_COMPANY_ID);
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (!apiEmail) {
    throw new Error('Missing API email. Provide config.apiEmail or SUPERFAKTURA_API_EMAIL.');
  }

  if (!apiKey) {
    throw new Error('Missing API key. Provide config.apiKey or SUPERFAKTURA_API_KEY.');
  }

  const authHeader = createAuthHeader({
    apiEmail,
    apiKey,
    ...(companyId !== undefined ? { companyId } : {}),
  });

  const httpClient = new HttpClient({
    baseUrl,
    authHeader,
    timeoutMs,
  });

  return {
    contacts: new ContactsApiImpl(httpClient),
    invoices: new InvoicesApiImpl(httpClient),
  };
}
