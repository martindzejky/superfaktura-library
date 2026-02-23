export type UnknownRecord = Record<string, unknown>;

export interface ClientConfig {
  baseUrl?: string;
  apiEmail?: string;
  apiKey?: string;
  companyId?: number;
  timeoutMs?: number;
}

export interface Result<T> {
  statusCode: number;
  data: T;
}

export interface ListResult<T> {
  statusCode: number;
  items: T[];
  page: number;
  pageCount: number;
  itemCount: number;
  perPage: number;
}

export interface BinaryResult {
  statusCode: number;
  data: Uint8Array;
  contentType?: string;
}

export interface ListQuery {
  page?: number;
  perPage?: number;
  search?: string;
}
