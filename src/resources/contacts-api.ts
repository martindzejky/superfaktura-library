import { toNamedQueryPath } from '../core/query-path';
import type { ListQuery, ListResult, Result, UnknownRecord } from '../core/types';
import { HttpClient } from '../core/http-client';
import { isRecord, safeParse } from '../core/utils';
import { ApiClientResponseSchema } from '../data/api';
import { contactFromApi, contactInputToApi, contactUpdateInputToApi } from '../data/contact-adapter';
import type { Contact, ContactInput, ContactUpdateInput } from '../data/contact';

function extractContact(data: UnknownRecord): Contact {
  const nested = isRecord(data.data) ? data.data : data;
  const raw = nested.Client;
  if (!isRecord(raw)) {
    throw new Error('Unexpected API response: missing Client object.');
  }
  return contactFromApi(safeParse(ApiClientResponseSchema, raw, 'API client response'));
}

export class ContactsApiImpl {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async create(input: ContactInput): Promise<Result<Contact>> {
    const body = contactInputToApi(input);
    const result = await this.httpClient.request('POST', '/clients/create', body);
    return { statusCode: result.statusCode, data: extractContact(result.data) };
  }

  async getById(id: string): Promise<Result<Contact>> {
    const result = await this.httpClient.request('GET', `/clients/view/${id}`);
    return { statusCode: result.statusCode, data: extractContact(result.data) };
  }

  async list(query: ListQuery = {}): Promise<ListResult<Contact>> {
    const namedQuery = toNamedQueryPath(query);
    const suffix = namedQuery.length > 0 ? `/${namedQuery}` : '';
    const result = await this.httpClient.request('GET', `/clients/index.json${suffix}`);
    const data = result.data;

    const rawItems = Array.isArray(data.items) ? data.items : [];
    const items: Contact[] = [];

    for (const item of rawItems) {
      if (!isRecord(item)) continue;
      const raw = item.Client;
      if (!isRecord(raw)) continue;
      items.push(contactFromApi(safeParse(ApiClientResponseSchema, raw, 'API client response')));
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

  async update(id: string, input: ContactUpdateInput): Promise<Result<Contact>> {
    const body = contactUpdateInputToApi(input);
    body.Client.id = id;
    const result = await this.httpClient.request('PATCH', `/clients/edit/${id}`, body);
    return { statusCode: result.statusCode, data: extractContact(result.data) };
  }

  async remove(id: string): Promise<void> {
    await this.httpClient.request('DELETE', `/clients/delete/${id}`);
  }
}
