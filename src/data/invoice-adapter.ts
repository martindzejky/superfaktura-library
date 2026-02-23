import type { UnknownRecord } from '../types';
import { emptyToUndefined, formatDate, nullToUndefined } from '../utils';
import type { ApiInvoiceItemResponse, ApiInvoiceResponse } from './api';
import type { Invoice, InvoiceInput, InvoiceItem, InvoiceItemInput } from './invoice';

const STATUS_LOOKUP: Record<string, Invoice['status']> = {
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
    quantity: raw.quantity !== null ? parseFloat(raw.quantity) : undefined,
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
  const amount = parseFloat(raw.amount);
  const vatAmount = parseFloat(raw.vat);

  return {
    id: raw.id,
    clientId: raw.client_id,
    name: raw.name,
    type: raw.type as Invoice['type'],
    status: STATUS_LOOKUP[raw.status] ?? ('draft' as Invoice['status']),
    flag: raw.flag as Invoice['flag'],
    totalWithoutVat: amount,
    totalWithVat: amount + vatAmount,
    vat: vatAmount,
    invoiceCurrency: raw.invoice_currency as Invoice['invoiceCurrency'],
    homeCurrency: raw.home_currency as Invoice['homeCurrency'],
    exchangeRate: raw.exchange_rate,
    invoiceNo: raw.invoice_no,
    invoiceNoFormatted: raw.invoice_no_formatted,
    variableSymbol: emptyToUndefined(raw.variable),
    constantSymbol: emptyToUndefined(raw.constant),
    specificSymbol: emptyToUndefined(raw.specific),
    created: new Date(raw.created),
    modified: new Date(raw.modified),
    deliveryDate: new Date(raw.delivery ?? raw.created),
    dueDate: new Date(raw.due),
    paymentType: nullToUndefined(raw.payment_type) as Invoice['paymentType'],
    headerComment: emptyToUndefined(raw.header_comment),
    internalComment: emptyToUndefined(raw.internal_comment),
    comment: emptyToUndefined(raw.comment),
    discount: parseFloat(raw.discount),
    token: raw.token,
    items: rawItems.map(invoiceItemFromApi) as [InvoiceItem, ...InvoiceItem[]],
  };
}

export function invoiceItemInputToApi(input: InvoiceItemInput): UnknownRecord {
  const result: UnknownRecord = {};

  if (input.name) result.name = input.name;
  if (input.description) result.description = input.description;
  if (input.quantity) result.quantity = input.quantity;
  if (input.unitOfMeasure) result.unit = input.unitOfMeasure;
  if (input.unitPrice) result.unit_price = input.unitPrice;
  if (input.tax) result.tax = input.tax;
  if (input.discount) result.discount = input.discount;

  return result;
}

export function invoiceInputToApi(input: InvoiceInput): {
  Invoice: UnknownRecord;
  InvoiceItem: UnknownRecord[];
} {
  const invoice: UnknownRecord = {};

  if (input.name) invoice.name = input.name;
  if (input.type) invoice.type = input.type;
  if (input.invoiceCurrency) invoice.invoice_currency = input.invoiceCurrency;
  if (input.variableSymbol) invoice.variable = input.variableSymbol;
  if (input.constantSymbol) invoice.constant = input.constantSymbol;
  if (input.specificSymbol) invoice.specific = input.specificSymbol;
  if (input.created) invoice.created = formatDate(input.created);
  if (input.deliveryDate) invoice.delivery = formatDate(input.deliveryDate);
  if (input.dueDate) invoice.due = formatDate(input.dueDate);
  if (input.paymentType) invoice.payment_type = input.paymentType;
  if (input.headerComment) invoice.header_comment = input.headerComment;
  if (input.internalComment) invoice.internal_comment = input.internalComment;
  if (input.comment) invoice.comment = input.comment;
  if (input.discount) invoice.discount = input.discount;
  if (input.markAsAlreadyPaid) invoice.already_paid = 1;
  if (input.markAsSent) invoice.mark_sent = 1;

  return {
    Invoice: invoice,
    InvoiceItem: input.items.map(invoiceItemInputToApi),
  };
}
