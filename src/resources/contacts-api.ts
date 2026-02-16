import { toNamedQueryPath } from '../core/query-path';
import type { ContactPayload, ListQuery, Result } from '../types';
import { HttpClient } from '../core/http-client';

export class ContactsApiImpl {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  create(payload: ContactPayload): Promise<Result<Record<string, unknown>>> {
    return this.httpClient.request('POST', '/clients/create', {
      Client: payload,
    });
  }

  getById(id: number): Promise<Result<Record<string, unknown>>> {
    return this.httpClient.request('GET', `/clients/view/${id}`);
  }

  list(query: ListQuery = {}): Promise<Result<Record<string, unknown>>> {
    const namedQuery = toNamedQueryPath(query);
    const suffix = namedQuery.length > 0 ? `/${namedQuery}` : '';
    return this.httpClient.request('GET', `/clients/index.json${suffix}`);
  }

  update(id: number, payload: ContactPayload): Promise<Result<Record<string, unknown>>> {
    return this.httpClient.request('PATCH', `/clients/edit/${id}`, {
      Client: {
        ...payload,
        id,
      },
    });
  }

  remove(id: number): Promise<Result<Record<string, unknown>>> {
    return this.httpClient.request('DELETE', `/clients/delete/${id}`);
  }
}
