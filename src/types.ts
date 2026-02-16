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

export type InvoiceContactDataSource = 'empty' | 'merge' | 'addressbook';

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
  address?: string;
  city?: string;
  country?: string;
  currency?: string;
  dic?: string;
  email?: string;
  iban?: string;
  ic_dph?: string;
  ico?: string;
  phone?: string;
  zip?: string;
}

export interface InvoiceItemPayload {
  name?: string;
  description?: string;
  unit?: string;
  unit_price?: number;
  quantity?: number;
}

export interface InvoiceDataPayload {
  name?: string;
  constant?: string;
  created?: string;
  delivery?: string;
  due?: string;
  header_comment?: string;
  internal_comment?: string;
  invoice_currency?: string;
  already_paid?: 0 | 1;
  mark_sent?: 0 | 1;
  paydate?: string;
  payment_type?: InvoicePaymentType;
  specific?: string;
  variable?: string;
}

export interface InvoiceContactPayload extends ContactPayload {
  id?: number;
  data_source?: InvoiceContactDataSource;
}

export interface InvoiceCreatePayload {
  invoice?: InvoiceDataPayload;
  items: InvoiceItemPayload[];
  contact: InvoiceContactPayload;
}

export interface InvoiceUpdatePayload {
  id: number;
  invoice?: InvoiceDataPayload;
  items?: InvoiceItemPayload[];
  contact?: InvoiceContactPayload;
}

export interface InvoicePaymentPayload {
  amount?: number;
  currency?: string;
  date?: string;
  payment_type?: InvoicePaymentType;
}
