import { z } from 'zod';
import { CurrencySchema } from './currency';

export const PaymentTypeSchema = z.enum([
  'accreditation',
  'barion',
  'besteron',
  'cash',
  'card',
  'cod',
  'credit',
  'debit',
  'inkaso',
  'gopay',
  'other',
  'paypal',
  'transfer',
  'trustpay',
  'viamo',
]);

export type PaymentType = z.infer<typeof PaymentTypeSchema>;

export const InvoiceTypeSchema = z.enum(['regular', 'proforma', 'cancel', 'estimate', 'order']);

export type InvoiceType = z.infer<typeof InvoiceTypeSchema>;

export const InvoiceStatusSchema = z.enum(['draft', 'sent', 'overdue', 'paid']);

export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export const InvoiceFlagSchema = z.enum(['issued', 'partially_paid', 'paid', 'overdue']);

export type InvoiceFlag = z.infer<typeof InvoiceFlagSchema>;

// fields that can be specified when creating or updating an invoice item
const InvoiceItemInputBase = z.object({
  description: z.string().optional(), // item description
  quantity: z.number().optional(), // quantity, defaults to 1
  unitOfMeasure: z.string().optional(), // unit of measure (e.g. "ks", "hod", "m")
  tax: z.number().optional(), // VAT rate percentage (use 0 if not a tax payer)
  discount: z.number().optional(), // discount percentage, defaults to 0
});

// at least one of name or unitPrice must be filled
export const InvoiceItemInputSchema = z.union([
  InvoiceItemInputBase.extend({
    name: z.string(), // item name
    unitPrice: z.number().optional(), // price per unit without VAT
  }),
  InvoiceItemInputBase.extend({
    name: z.string().optional(), // item name
    unitPrice: z.number(), // price per unit without VAT
  }),
]);

export type InvoiceItemInput = z.infer<typeof InvoiceItemInputSchema>;

// full invoice item as returned by the library
export const InvoiceItemSchema = InvoiceItemInputBase.extend({
  id: z.string(), // unique item ID
  invoiceId: z.string(), // parent invoice ID
  name: z.string(), // item name
  unitPrice: z.number(), // price per unit without VAT
  tax: z.number(), // VAT rate percentage
  discount: z.number(), // discount percentage
  itemPrice: z.number(), // total price without VAT (computed)
  itemPriceWithoutDiscount: z.number(), // total price without VAT before discount (computed)
  itemPriceWithVat: z.number(), // total price with VAT (computed)
  itemPriceWithVatWithoutDiscount: z.number(), // total price with VAT before discount (computed)
  unitPriceWithVat: z.number(), // unit price with VAT (computed)
  unitPriceWithVatWithoutDiscount: z.number(), // unit price with VAT before discount (computed)
  unitPriceWithDiscount: z.number(), // unit price after discount (computed)
  orderNumber: z.string(), // order/position number within invoice
});

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;

// fields that can be specified when creating or updating an invoice
export const InvoiceInputSchema = z.object({
  name: z.string().optional(), // invoice name / title
  type: InvoiceTypeSchema.optional(), // invoice type, defaults to "regular"
  invoiceCurrency: CurrencySchema.optional(), // currency of the invoice
  variableSymbol: z.string().optional(), // variable symbol for payment identification
  constantSymbol: z.string().optional(), // constant symbol
  specificSymbol: z.string().optional(), // specific symbol
  created: z.date().optional(), // issue date
  deliveryDate: z.date().optional(), // delivery date
  dueDate: z.date().optional(), // due date
  paymentType: PaymentTypeSchema.optional(), // payment method
  headerComment: z.string().optional(), // comment displayed above invoice items
  internalComment: z.string().optional(), // internal comment (not shown on invoice)
  comment: z.string().optional(), // general comment
  discount: z.number().optional(), // global discount percentage, defaults to 0
  markAsAlreadyPaid: z.boolean().optional(), // mark invoice as already paid on creation
  markAsSent: z.boolean().optional(), // mark invoice as sent via email on creation
  items: z.array(InvoiceItemInputSchema).nonempty(), // invoice line items (at least one required)
});

export type InvoiceInput = z.infer<typeof InvoiceInputSchema>;

// full invoice as returned by the library, extends the input with read-only fields
export const InvoiceSchema = InvoiceInputSchema.extend({
  id: z.string(), // unique invoice ID
  clientId: z.string(), // linked client/contact ID
  name: z.string(), // resolved invoice name
  type: InvoiceTypeSchema, // resolved invoice type
  status: InvoiceStatusSchema, // invoice status
  flag: InvoiceFlagSchema, // invoice flag
  totalWithoutVat: z.number(), // total amount without VAT (computed)
  totalWithVat: z.number(), // total amount with VAT (computed)
  vat: z.number(), // total VAT amount (computed)
  invoiceCurrency: CurrencySchema, // resolved currency
  homeCurrency: CurrencySchema, // home/base currency
  exchangeRate: z.number(), // exchange rate between invoice and home currency
  invoiceNo: z.string(), // invoice number (raw)
  invoiceNoFormatted: z.string(), // formatted invoice number for display
  created: z.date(), // resolved issue date
  modified: z.date(), // when the invoice was last modified
  deliveryDate: z.date(), // resolved delivery date
  dueDate: z.date(), // resolved due date
  discount: z.number(), // resolved discount percentage
  token: z.string(), // public access token for online viewing
  items: z.array(InvoiceItemSchema).nonempty(), // resolved invoice line items
});

export type Invoice = z.infer<typeof InvoiceSchema>;
