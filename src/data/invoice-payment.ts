import { z } from 'zod';
import { Currency } from './currency';
import { PaymentType } from './invoice';

export const InvoicePaymentInputSchema = z.object({
  amount: z.number().optional(), // amount paid, defaults to invoice total
  currency: Currency.optional(), // payment currency
  date: z.date().optional(), // payment date
  paymentType: PaymentType.optional(), // payment method, defaults to "transfer"
});

export type InvoicePaymentInput = z.infer<typeof InvoicePaymentInputSchema>;
