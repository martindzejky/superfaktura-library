import { z } from 'zod';
import { CurrencySchema } from './currency';

// fields that can be specified when creating or updating a contact
export const ContactInputSchema = z.object({
  name: z.string(), // client name (required)
  ico: z.string().optional(), // IČO - company registration number
  dic: z.string().optional(), // DIČ - tax ID (SK)
  icDph: z.string().optional(), // IČ DPH (SK) / DIČ (CZ) - VAT ID
  address: z.string().optional(), // street and house number
  city: z.string().optional(),
  zip: z.string().optional(),
  state: z.string().optional(), // state or province
  country: z.string().optional(), // custom country name
  countryId: z.string().optional(), // country ID from value list
  deliveryName: z.string().optional(), // delivery contact name
  deliveryAddress: z.string().optional(), // delivery street and house number
  deliveryCity: z.string().optional(),
  deliveryZip: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryCountry: z.string().optional(), // custom delivery country name
  deliveryCountryId: z.string().optional(), // delivery country ID from value list
  deliveryPhone: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  defaultCurrency: CurrencySchema.optional(), // default currency used on documents for this client
  defaultVariableSymbol: z.string().optional(), // default variable symbol on documents
  defaultDiscount: z.number().optional(), // default discount percentage on documents
  defaultDueDays: z.number().optional(), // default due days on documents
  iban: z.string().optional(),
  comment: z.string().optional(), // internal comment
  uuid: z.string().optional(), // custom unique identifier
});

export type ContactInput = z.infer<typeof ContactInputSchema>;

// full contact as returned by the library, extends the input with read-only fields
export const ContactSchema = ContactInputSchema.extend({
  id: z.string(), // unique client ID
  created: z.date(), // when the contact was created
  modified: z.date(), // when the contact was last modified
  bankAccount: z.string().optional(),
  bankAccountPrefix: z.string().optional(),
  bankCode: z.string().optional(),
  swift: z.string().optional(),
});

export type Contact = z.infer<typeof ContactSchema>;
