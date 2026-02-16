export type UnknownRecord = Record<string, unknown>;

export type ScalarValue = string | number | boolean | null | undefined;

export type InvoicePaymentType =
  | 'accreditation'
  | 'barion'
  | 'besteron'
  | 'cash'
  | 'card'
  | 'cod'
  | 'credit'
  | 'debit'
  | 'inkaso'
  | 'gopay'
  | 'other'
  | 'paypal'
  | 'transfer'
  | 'trustpay'
  | 'viamo';

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
  [key: string]: ScalarValue;
}

export interface InvoiceItemPayload {
  name?: string;
  unit_price?: number;
  quantity?: number;
  tax?: number;
  description?: string;
  [key: string]: ScalarValue;
}

export interface InvoiceCreatePayload {
  invoice?: UnknownRecord;
  items: InvoiceItemPayload[];
  contact: ContactPayload;
  settings?: UnknownRecord;
  extra?: UnknownRecord;
  myData?: UnknownRecord;
  tags?: number[];
}

export interface InvoiceUpdatePayload {
  id: number;
  invoice?: UnknownRecord;
  items?: InvoiceItemPayload[];
  contact?: ContactPayload;
  settings?: UnknownRecord;
  extra?: UnknownRecord;
  myData?: UnknownRecord;
  tags?: number[];
}

export interface InvoicePaymentPayload {
  amount?: number;
  currency?: string;
  date?: string;
  payment_type?: InvoicePaymentType;
}
