import { z } from 'zod';

// ---------- Client (API calls it "Client", we call it "Contact") ----------

export const ApiClientResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  user_profile_id: z.string(),
  name: z.string(),
  ico: z.string().nullable(), // IČO - company ID
  dic: z.string().nullable(), // DIČ - tax ID (SK)
  ic_dph: z.string().nullable(), // IČ DPH (SK) / DIČ (CZ) - VAT ID
  address: z.string().nullable(), // street + number
  city: z.string().nullable(),
  zip: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(), // country name (computed from country_id)
  country_id: z.string().nullable(),
  delivery_name: z.string().nullable(),
  delivery_address: z.string().nullable(),
  delivery_city: z.string().nullable(),
  delivery_zip: z.string().nullable(),
  delivery_state: z.string().nullable(),
  delivery_country: z.string().nullable(),
  delivery_country_id: z.string().nullable(),
  delivery_phone: z.string().nullable(),
  phone: z.string().nullable(),
  fax: z.string().nullable(),
  email: z.string().nullable(),
  currency: z.string().nullable(), // default currency on documents
  default_variable: z.string().nullable(), // default variable symbol
  discount: z.string().nullable(), // default discount (float as string)
  due_date: z.string().nullable(), // default due days
  bank_account: z.string().nullable(),
  bank_account_prefix: z.string().nullable(),
  bank_code: z.string().nullable(),
  iban: z.string().nullable(),
  swift: z.string().nullable(),
  comment: z.string().nullable(),
  uuid: z.string().nullable(),
  created: z.string(), // "YYYY-MM-DD HH:MM:SS"
  modified: z.string(), // "YYYY-MM-DD HH:MM:SS"
});

export type ApiClientResponse = z.infer<typeof ApiClientResponseSchema>;

// ---------- Invoice ----------

export const ApiInvoiceResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  user_profile_id: z.string(),
  client_id: z.string(),
  name: z.string(),
  type: z.string(), // "regular", "proforma", "cancel", "estimate", "order"
  status: z.string(), // numeric string: 1=draft, 2=sent, 3=overdue, 99=paid
  flag: z.string(), // "issued", "partially_paid", "paid", "overdue"
  amount: z.string(), // total without VAT
  vat: z.string(), // VAT amount
  amount_paid: z.string(),
  invoice_currency: z.string(),
  home_currency: z.string(),
  exchange_rate: z.number(),
  invoice_no: z.string(),
  invoice_no_formatted: z.string(),
  variable: z.string(), // variable symbol
  constant: z.string().nullable(), // constant symbol
  specific: z.string().nullable(), // specific symbol
  created: z.string(), // issue date
  delivery: z.string().nullable(), // delivery date
  due: z.string(), // due date
  paid: z.string(), // paid amount (string)
  paydate: z.string().nullable(), // payment date
  payment_type: z.string().nullable(),
  header_comment: z.string().nullable(),
  internal_comment: z.string().nullable(),
  comment: z.string().nullable(),
  order_no: z.string().nullable(),
  discount: z.string(), // discount percentage
  deposit: z.string(), // deposit paid
  token: z.string(), // public access token
  demo: z.string(),
  modified: z.string(),
});

export type ApiInvoiceResponse = z.infer<typeof ApiInvoiceResponseSchema>;

// ---------- Invoice Item ----------

export const ApiInvoiceItemResponseSchema = z.object({
  id: z.string(),
  invoice_id: z.string(),
  user_id: z.string(),
  user_profile_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  quantity: z.string().nullable(),
  unit: z.string().nullable(), // e.g. "ks", "hod", "m"
  unit_price: z.number(), // price without VAT
  tax: z.number(), // VAT rate
  discount: z.number(), // discount percentage
  item_price: z.number(), // total price without VAT
  item_price_no_discount: z.number(),
  item_price_vat: z.number(), // total price with VAT
  item_price_vat_no_discount: z.number(),
  unit_price_vat: z.number(), // unit price with VAT
  unit_price_vat_no_discount: z.number(),
  unit_price_discount: z.number(),
  ordernum: z.string(),
  sku: z.string().nullable(), // stock number
  stock_item_id: z.string().nullable(),
});

export type ApiInvoiceItemResponse = z.infer<typeof ApiInvoiceItemResponseSchema>;

// ---------- Invoice Payment ----------

export const ApiInvoicePaymentResponseSchema = z.object({
  country_exchange_rate: z.number(),
  created: z.string(), // "YYYY-MM-DD"
  currency: z.string(), // currency symbol
  exchange_rate: z.number(),
  home_currency: z.string(), // home currency symbol
  invoice_currency: z.string(), // invoice currency symbol
  invoice_id: z.number(),
  invoice_type: z.string(), // "regular", "proforma", "cancel"
  overdue: z.boolean(),
  paid: z.number(), // total paid amount
  parent_id: z.number().nullable(),
  payment_id: z.string(),
  status: z.number(), // invoice status after payment
  to_pay: z.number(), // remaining amount to pay
  to_pay_home_cur: z.number(), // remaining amount in home currency
});

export type ApiInvoicePaymentResponse = z.infer<typeof ApiInvoicePaymentResponseSchema>;
