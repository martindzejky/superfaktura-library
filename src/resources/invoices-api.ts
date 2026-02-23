import { HttpClient } from '../core/http-client';
import { toNamedQueryPath } from '../core/query-path';
import type {
  BinaryResult,
  InvoiceCreatePayload,
  InvoicePaymentPayload,
  InvoiceUpdatePayload,
  ListQuery,
  Result,
  UnknownRecord,
} from '../core/types';

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
    });
  }

  remove(id: number): Promise<Result<UnknownRecord>> {
    return this.httpClient.request('DELETE', `/invoices/delete/${id}`);
  }

  pay(id: number, payload: InvoicePaymentPayload = {}): Promise<Result<UnknownRecord>> {
    const invoicePayment: UnknownRecord = {
      invoice_id: id,
    };

    if (payload.amount !== undefined) {
      invoicePayment.amount = payload.amount;
    }
    if (payload.currency !== undefined) {
      invoicePayment.currency = payload.currency;
    }
    if (payload.date !== undefined) {
      invoicePayment.date = payload.date;
    }
    if (payload.payment_type !== undefined) {
      invoicePayment.payment_type = payload.payment_type;
    }

    return this.httpClient.request('POST', '/invoice_payments/add/ajax%3A1/api%3A1', {
      InvoicePayment: invoicePayment,
    });
  }

  markAsSent(id: number): Promise<Result<UnknownRecord>> {
    return this.httpClient.request('GET', `/invoices/mark_sent/${id}`);
  }

  downloadPdf(id: number, language = 'slo'): Promise<BinaryResult> {
    return this.httpClient.requestBinary('GET', `/${language}/invoices/pdf/${id}`);
  }
}
