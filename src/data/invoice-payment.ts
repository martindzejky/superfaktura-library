import { z } from 'zod';
import { CurrencySchema } from './currency';
import { PaymentTypeSchema } from './invoice';

export const InvoicePaymentInputSchema = z.object({
  amount: z.number().optional(), // amount paid, defaults to invoice total
  currency: CurrencySchema.optional(), // payment currency
  date: z.date().optional(), // payment date
  paymentType: PaymentTypeSchema.optional(), // payment method, defaults to "transfer"
});

export type InvoicePaymentInput = z.infer<typeof InvoicePaymentInputSchema>;
