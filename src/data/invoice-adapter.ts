import type { UnknownRecord } from '../core/types';
import { emptyToUndefined, formatDate, safeParseDate, safeParseFloat, safeParse } from '../core/utils';
import { CurrencySchema } from './currency';
import type { ApiInvoiceItemResponse, ApiInvoiceResponse } from './api';
import type { Invoice, InvoiceInput, InvoiceItem, InvoiceItemInput, InvoiceUpdateInput } from './invoice';
import { InvoiceFlagSchema, InvoiceStatusSchema, InvoiceTypeSchema, PaymentTypeSchema } from './invoice';

const STATUS_LOOKUP: Record<string, string> = {
  '1': 'draft',
  '2': 'sent',
  '3': 'overdue',
  '99': 'paid',
};

export function invoiceItemFromApi(raw: ApiInvoiceItemResponse): InvoiceItem {
  return {
    id: raw.id,
    invoiceId: raw.invoice_id,
    name: raw.name,
    description: emptyToUndefined(raw.description),
    quantity:
      raw.quantity !== null && raw.quantity !== '' ? safeParseFloat(raw.quantity, 'invoice item quantity') : undefined,
    unitOfMeasure: emptyToUndefined(raw.unit),
    unitPrice: raw.unit_price,
    tax: raw.tax,
    discount: raw.discount,
    itemPrice: raw.item_price,
    itemPriceWithoutDiscount: raw.item_price_no_discount,
    itemPriceWithVat: raw.item_price_vat,
    itemPriceWithVatWithoutDiscount: raw.item_price_vat_no_discount,
    unitPriceWithVat: raw.unit_price_vat,
    unitPriceWithVatWithoutDiscount: raw.unit_price_vat_no_discount,
    unitPriceWithDiscount: raw.unit_price_discount,
    orderNumber: raw.ordernum,
  };
}

export function invoiceFromApi(raw: ApiInvoiceResponse, rawItems: ApiInvoiceItemResponse[]): Invoice {
  const amount = safeParseFloat(raw.amount, 'invoice amount');
  const vatAmount = safeParseFloat(raw.vat, 'invoice vat');
  const statusMapped = STATUS_LOOKUP[raw.status] ?? 'draft';

  const invoice: Invoice = {
    id: raw.id,
    clientId: raw.client_id,
    name: raw.name,
    type: safeParse(InvoiceTypeSchema, raw.type, 'invoice type'),
    status: safeParse(InvoiceStatusSchema, statusMapped, 'invoice status'),
    flag: raw.flag ? safeParse(InvoiceFlagSchema, raw.flag, 'invoice flag') : 'issued',
    totalWithoutVat: amount,
    totalWithVat: amount + vatAmount,
    vat: vatAmount,
    invoiceCurrency: safeParse(CurrencySchema, raw.invoice_currency, 'invoice currency'),
    homeCurrency: safeParse(CurrencySchema, raw.home_currency, 'home currency'),
    exchangeRate: raw.exchange_rate,
    invoiceNo: raw.invoice_no,
    invoiceNoFormatted: raw.invoice_no_formatted,
    variableSymbol: emptyToUndefined(raw.variable),
    constantSymbol: emptyToUndefined(raw.constant),
    specificSymbol: emptyToUndefined(raw.specific),
    created: safeParseDate(raw.created, 'invoice created'),
    modified: safeParseDate(raw.modified, 'invoice modified'),
    deliveryDate: safeParseDate(raw.delivery ?? raw.created, 'invoice delivery date'),
    dueDate: safeParseDate(raw.due, 'invoice due date'),
    paymentType: raw.payment_type ? safeParse(PaymentTypeSchema, raw.payment_type, 'payment type') : undefined,
    headerComment: emptyToUndefined(raw.header_comment),
    internalComment: emptyToUndefined(raw.internal_comment),
    comment: emptyToUndefined(raw.comment),
    discount: safeParseFloat(raw.discount, 'invoice discount'),
    token: raw.token,
    items: rawItems.map(invoiceItemFromApi) as [InvoiceItem, ...InvoiceItem[]],
  };

  if (invoice.items.length === 0) {
    throw new Error('Unexpected API response: invoice has no items.');
  }

  return invoice;
}

export function invoiceItemInputToApi(input: InvoiceItemInput): UnknownRecord {
  const result: UnknownRecord = {};

  if (input.name !== undefined) result.name = input.name;
  if (input.description !== undefined) result.description = input.description;
  if (input.quantity !== undefined) result.quantity = input.quantity;
  if (input.unitOfMeasure !== undefined) result.unit = input.unitOfMeasure;
  if (input.unitPrice !== undefined) result.unit_price = input.unitPrice;
  if (input.tax !== undefined) result.tax = input.tax;
  if (input.discount !== undefined) result.discount = input.discount;

  return result;
}

function invoiceFieldsToApi(input: InvoiceUpdateInput): UnknownRecord {
  const invoice: UnknownRecord = {};

  if (input.name !== undefined) invoice.name = input.name;
  if (input.type !== undefined) invoice.type = input.type;
  if (input.invoiceCurrency !== undefined) invoice.invoice_currency = input.invoiceCurrency;
  if (input.variableSymbol !== undefined) invoice.variable = input.variableSymbol;
  if (input.constantSymbol !== undefined) invoice.constant = input.constantSymbol;
  if (input.specificSymbol !== undefined) invoice.specific = input.specificSymbol;
  if (input.created !== undefined) invoice.created = formatDate(input.created);
  if (input.deliveryDate !== undefined) invoice.delivery = formatDate(input.deliveryDate);
  if (input.dueDate !== undefined) invoice.due = formatDate(input.dueDate);
  if (input.paymentType !== undefined) invoice.payment_type = input.paymentType;
  if (input.headerComment !== undefined) invoice.header_comment = input.headerComment;
  if (input.internalComment !== undefined) invoice.internal_comment = input.internalComment;
  if (input.comment !== undefined) invoice.comment = input.comment;
  if (input.discount !== undefined) invoice.discount = input.discount;

  return invoice;
}

export function invoiceInputToApi(input: InvoiceInput): {
  Invoice: UnknownRecord;
  InvoiceItem: UnknownRecord[];
} {
  const invoice = invoiceFieldsToApi(input);
  if (input.markAsAlreadyPaid) invoice.already_paid = 1;
  if (input.markAsSent) invoice.mark_sent = 1;

  return {
    Invoice: invoice,
    InvoiceItem: input.items.map(invoiceItemInputToApi),
  };
}

export function invoiceUpdateInputToApi(input: InvoiceUpdateInput): {
  Invoice: UnknownRecord;
  InvoiceItem?: UnknownRecord[];
} {
  const invoice = invoiceFieldsToApi(input);
  const result: { Invoice: UnknownRecord; InvoiceItem?: UnknownRecord[] } = { Invoice: invoice };

  if (input.items) {
    result.InvoiceItem = input.items.map(invoiceItemInputToApi);
  }

  return result;
}
