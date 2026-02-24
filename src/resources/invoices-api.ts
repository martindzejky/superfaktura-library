import { HttpClient } from '../core/http-client';
import { toNamedQueryPath } from '../core/query-path';
import type { BinaryResult, ListQuery, ListResult, Result, UnknownRecord } from '../core/types';
import { formatDate, isRecord, safeParse } from '../core/utils';
import { ApiInvoiceItemResponseSchema, ApiInvoiceResponseSchema } from '../data/api';
import type { ContactInput } from '../data/contact';
import { ContactInputSchema } from '../data/contact';
import { contactInputToApi } from '../data/contact-adapter';
import type { Invoice, InvoiceInput, InvoiceUpdateInput } from '../data/invoice';
import { invoiceFromApi, invoiceInputToApi, invoiceUpdateInputToApi } from '../data/invoice-adapter';
import type { InvoicePaymentInput } from '../data/invoice-payment';
import type { Language } from '../data/language';

function resolveContactPayload(contact: ContactInput | { id: string }): UnknownRecord {
  if ('id' in contact && typeof contact.id === 'string') {
    return { id: contact.id };
  }
  const validated = safeParse(ContactInputSchema, contact, 'contact input');
  return contactInputToApi(validated).Client;
}

function extractInvoice(data: UnknownRecord): Invoice {
  const nested = isRecord(data.data) ? data.data : data;

  const rawInvoice = nested.Invoice;
  if (!isRecord(rawInvoice)) {
    throw new Error('Unexpected API response: missing Invoice object.');
  }

  const rawItems = Array.isArray(nested.InvoiceItem) ? nested.InvoiceItem : [];
  const parsedInvoice = safeParse(ApiInvoiceResponseSchema, rawInvoice, 'API invoice response');
  const parsedItems = rawItems
    .filter((item): item is UnknownRecord => isRecord(item))
    .map((item) => safeParse(ApiInvoiceItemResponseSchema, item, 'API invoice item response'));

  return invoiceFromApi(parsedInvoice, parsedItems);
}

export class InvoicesApiImpl {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async create(input: InvoiceInput, contact: ContactInput | { id: string }): Promise<Result<Invoice>> {
    const { Invoice, InvoiceItem } = invoiceInputToApi(input);
    const Client = resolveContactPayload(contact);

    const result = await this.httpClient.request('POST', '/invoices/create', {
      Invoice,
      InvoiceItem,
      Client,
    });
    return { statusCode: result.statusCode, data: extractInvoice(result.data) };
  }

  async getById(id: string): Promise<Result<Invoice>> {
    const result = await this.httpClient.request('GET', `/invoices/view/${id}.json`);
    return { statusCode: result.statusCode, data: extractInvoice(result.data) };
  }

  async list(query: ListQuery = {}): Promise<ListResult<Invoice>> {
    const namedQuery = toNamedQueryPath(query);
    const suffix = namedQuery.length > 0 ? `/${namedQuery}` : '';
    const result = await this.httpClient.request('GET', `/invoices/index.json${suffix}`);
    const data = result.data;

    const rawItems = Array.isArray(data.items) ? data.items : [];
    const items: Invoice[] = [];

    for (const entry of rawItems) {
      if (!isRecord(entry)) continue;
      const rawInvoice = entry.Invoice;
      if (!isRecord(rawInvoice)) continue;

      const rawInvoiceItems = Array.isArray(entry.InvoiceItem) ? entry.InvoiceItem : [];
      const parsedInvoice = safeParse(ApiInvoiceResponseSchema, rawInvoice, 'API invoice response');
      const parsedItems = rawInvoiceItems
        .filter((item): item is UnknownRecord => isRecord(item))
        .map((item) => safeParse(ApiInvoiceItemResponseSchema, item, 'API invoice item response'));

      items.push(invoiceFromApi(parsedInvoice, parsedItems));
    }

    return {
      statusCode: result.statusCode,
      items,
      itemCount: typeof data.itemCount === 'number' ? data.itemCount : items.length,
      page: typeof data.page === 'number' ? data.page : 1,
      pageCount: typeof data.pageCount === 'number' ? data.pageCount : 1,
      perPage: typeof data.perPage === 'number' ? data.perPage : items.length,
    };
  }

  async update(
    id: string,
    input: InvoiceUpdateInput,
    contact?: ContactInput | { id: string },
  ): Promise<Result<Invoice>> {
    const payload = invoiceUpdateInputToApi(input);
    payload.Invoice.id = id;

    const body: UnknownRecord = { Invoice: payload.Invoice };

    if (payload.InvoiceItem !== undefined) {
      body.InvoiceItem = payload.InvoiceItem;
    }

    if (contact !== undefined) {
      body.Client = resolveContactPayload(contact);
    }

    const result = await this.httpClient.request('POST', '/invoices/edit', body);
    return { statusCode: result.statusCode, data: extractInvoice(result.data) };
  }

  async remove(id: string): Promise<void> {
    await this.httpClient.request('DELETE', `/invoices/delete/${id}`);
  }

  async pay(id: string, input: InvoicePaymentInput = {}): Promise<void> {
    const body: UnknownRecord = { invoice_id: id };

    if (input.amount !== undefined) body.amount = input.amount;
    if (input.currency !== undefined) body.currency = input.currency;
    if (input.date !== undefined) body.date = formatDate(input.date);
    if (input.paymentType !== undefined) body.payment_type = input.paymentType;

    await this.httpClient.request('POST', '/invoice_payments/add/ajax%3A1/api%3A1', {
      InvoicePayment: body,
    });
  }

  async markAsSent(id: string): Promise<void> {
    await this.httpClient.request('GET', `/invoices/mark_sent/${id}`);
  }

  downloadPdf(id: string, language: Language = 'slo'): Promise<BinaryResult> {
    return this.httpClient.requestBinary('GET', `/${language}/invoices/pdf/${id}`);
  }
}
