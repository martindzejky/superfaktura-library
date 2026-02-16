import { HttpClient } from '../core/http-client';
import { toNamedQueryPath } from '../core/query-path';
import type {
  BinaryResult,
  InvoiceCreatePayload,
  InvoiceUpdatePayload,
  ListQuery,
  Result,
  UnknownRecord,
} from '../types';

export class InvoicesApiImpl {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  create(payload: InvoiceCreatePayload): Promise<Result<UnknownRecord>> {
    return this.httpClient.request('POST', '/invoices/create', {
      Invoice: payload.invoice ?? {},
      InvoiceItem: payload.items,
      Client: payload.contact,
      InvoiceSetting: payload.settings ?? {},
      InvoiceExtra: payload.extra ?? {},
      MyData: payload.myData ?? {},
      Tag: payload.tags && payload.tags.length > 0 ? { Tag: payload.tags } : {},
    });
  }

  getById(id: number): Promise<Result<UnknownRecord>> {
    return this.httpClient.request('GET', `/invoices/view/${id}.json`);
  }

  list(query: ListQuery = {}): Promise<Result<UnknownRecord>> {
    const namedQuery = toNamedQueryPath(query);
    const suffix = namedQuery.length > 0 ? `/${namedQuery}` : '';
    return this.httpClient.request('GET', `/invoices/index.json${suffix}`);
  }

  update(payload: InvoiceUpdatePayload): Promise<Result<UnknownRecord>> {
    return this.httpClient.request('POST', '/invoices/edit', {
      Invoice: {
        id: payload.id,
        ...(payload.invoice ?? {}),
      },
      InvoiceItem: payload.items ?? [],
      Client: payload.contact ?? {},
      InvoiceSetting: payload.settings ?? {},
      InvoiceExtra: payload.extra ?? {},
      MyData: payload.myData ?? {},
      Tag: payload.tags && payload.tags.length > 0 ? { Tag: payload.tags } : {},
    });
  }

  remove(id: number): Promise<Result<UnknownRecord>> {
    return this.httpClient.request('DELETE', `/invoices/delete/${id}`);
  }

  downloadPdf(id: number, language = 'sk'): Promise<BinaryResult> {
    return this.httpClient.requestBinary(
      'GET',
      `/${language}/invoices/pdf/${id}`,
    );
  }
}
