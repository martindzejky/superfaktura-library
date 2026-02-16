export interface ClientConfig {
  baseUrl?: string;
  email?: string;
  apiKey?: string;
  companyId?: number;
  timeoutMs?: number;
}

export interface Result<TData = unknown> {
  statusCode: number;
  data: TData;
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

export interface ContactPayload {
  name: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface InvoiceItemPayload {
  name?: string;
  unit_price?: number;
  quantity?: number;
  tax?: number;
  description?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface InvoiceCreatePayload {
  invoice?: Record<string, unknown>;
  items: InvoiceItemPayload[];
  contact: ContactPayload;
  settings?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  myData?: Record<string, unknown>;
  tags?: number[];
}

export interface InvoiceUpdatePayload {
  id: number;
  invoice?: Record<string, unknown>;
  items?: InvoiceItemPayload[];
  contact?: ContactPayload;
  settings?: Record<string, unknown>;
  extra?: Record<string, unknown>;
  myData?: Record<string, unknown>;
  tags?: number[];
}
