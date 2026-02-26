import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import { parseDataInput } from '../parse-data';
import { resolveRuntimeContext } from '../runtime-context';
import { printSuccess, printVoidAction } from '../output-format';
import type { Invoice, InvoiceInput, InvoiceUpdateInput } from '../../data/invoice';
import { InvoiceInputSchema, InvoiceUpdateInputSchema } from '../../data/invoice';
import type { ContactInput } from '../../data/contact';
import { ContactInputSchema } from '../../data/contact';
import type { InvoicePaymentInput } from '../../data/invoice-payment';
import { InvoicePaymentInputSchema } from '../../data/invoice-payment';
import type { ListResult, Result, UnknownRecord } from '../../core/types';
import { isRecord, safeParse } from '../../core/utils';
import type { OutputFormat } from '../types';
import { LanguageSchema } from '../../data/language';

interface InvoiceOptions {
  data?: string;
  name?: string;
  price?: number;
  contactId?: string;
  contactName?: string;
  contactEmail?: string;
}

function buildContactFromFlags(
  options: InvoiceOptions,
  requireContact: boolean,
): ContactInput | { id: string } | undefined {
  const hasContactId = options.contactId !== undefined;
  const hasContactName = options.contactName !== undefined;
  const hasContactEmail = options.contactEmail !== undefined;
  const hasAnyContactFlag = hasContactId || hasContactName || hasContactEmail;

  if (!hasAnyContactFlag) {
    if (requireContact) {
      throw new Error('Provide --contact-id or --contact-name or --contact-email, or use --data.');
    }
    return undefined;
  }

  if (options.contactId !== undefined) {
    return { id: options.contactId };
  }

  const raw: UnknownRecord = {};
  if (options.contactName !== undefined) raw.name = options.contactName;
  if (options.contactEmail !== undefined) raw.email = options.contactEmail;
  return safeParse(ContactInputSchema, raw, 'contact input');
}

function parseContactFromData(data: UnknownRecord): ContactInput | { id: string } | undefined {
  const contactData = isRecord(data.contact) ? data.contact : undefined;
  if (contactData === undefined) {
    return undefined;
  }
  if (typeof contactData.id === 'string') {
    return { id: contactData.id };
  }
  return safeParse(ContactInputSchema, contactData, 'contact input');
}

function printInvoiceMutation(output: OutputFormat, action: string, verb: string, result: Result<Invoice>): void {
  if (output === 'json') {
    printSuccess(output, action, result);
    return;
  }
  console.log(`${verb} invoice with id ${result.data.id}.`);
}

function printInvoiceDetail(output: OutputFormat, result: Result<Invoice>): void {
  if (output === 'json') {
    printSuccess(output, 'invoices.get', result);
    return;
  }
  const invoice = result.data;
  console.log(`id: ${invoice.id}`);
  console.log(`name: ${invoice.name}`);
  console.log(`total: ${invoice.totalWithVat}`);
  console.log(`status: ${invoice.status}`);
}

function printInvoiceList(output: OutputFormat, result: ListResult<Invoice>): void {
  if (output === 'json') {
    printSuccess(output, 'invoices.list', { statusCode: result.statusCode, data: result });
    return;
  }

  if (result.items.length === 0) {
    console.log('No invoices.');
    return;
  }

  console.log(`${result.itemCount} items, page ${result.page}`);

  for (const invoice of result.items) {
    console.log(`${invoice.id}, ${invoice.name}, ${invoice.totalWithVat}, ${invoice.status}`);
  }
}

export function registerInvoiceCommands(rootProgram: Command): void {
  const invoices = rootProgram.command('invoices').description('Manage invoices.');

  invoices
    .command('create')
    .description('Create an invoice.')
    .option('--data <json>', 'JSON object or @path/to/file.json')
    .option('--name <text>', 'Invoice name')
    .option('--price <number>', 'Invoice total price', Number)
    .option('--contact-id <id>', 'Contact ID')
    .option('--contact-name <name>', 'Contact name')
    .option('--contact-email <email>', 'Contact email')
    .action(async (options: InvoiceOptions) => {
      const runtime = resolveRuntimeContext(invoices);

      let input: InvoiceInput;
      let contact: ContactInput | { id: string };

      if (options.data !== undefined) {
        const raw = await parseDataInput(options.data);
        const parsedContact = parseContactFromData(raw);
        if (parsedContact === undefined) {
          throw new Error('Missing "contact" in --data JSON.');
        }
        contact = parsedContact;

        const { contact: _, ...invoiceData } = raw;
        input = safeParse(InvoiceInputSchema, invoiceData, 'invoice input');
      } else {
        if (options.price === undefined) {
          throw new Error('Provide --price or use --data for invoice create.');
        }

        const flagContact = buildContactFromFlags(options, true);
        if (flagContact === undefined) {
          throw new Error('Missing contact data.');
        }
        contact = flagContact;

        const invoiceRaw: UnknownRecord = {
          items: [{ unitPrice: options.price }],
        };
        if (options.name !== undefined) {
          invoiceRaw.name = options.name;
        }
        input = safeParse(InvoiceInputSchema, invoiceRaw, 'invoice input');
      }

      const result = await runtime.client.invoices.create(input, contact);
      printInvoiceMutation(runtime.output, 'invoices.create', 'Created', result);
    });

  invoices
    .command('get')
    .description('Get an invoice by ID.')
    .argument('<id>', 'Invoice ID')
    .action(async (id: string) => {
      const runtime = resolveRuntimeContext(invoices);
      const result = await runtime.client.invoices.getById(id);
      printInvoiceDetail(runtime.output, result);
    });

  invoices
    .command('list')
    .description('List invoices.')
    .option('--page <number>', 'Page number', Number)
    .option('--per-page <number>', 'Items per page', Number)
    .option('--search <text>', 'Search text')
    .action(async (options: { page?: number; perPage?: number; search?: string }) => {
      const runtime = resolveRuntimeContext(invoices);
      const query: {
        page?: number;
        perPage?: number;
        search?: string;
      } = {};
      if (options.page !== undefined) {
        query.page = options.page;
      }
      if (options.perPage !== undefined) {
        query.perPage = options.perPage;
      }
      if (options.search !== undefined) {
        query.search = options.search;
      }
      const result = await runtime.client.invoices.list(query);
      printInvoiceList(runtime.output, result);
    });

  invoices
    .command('update')
    .description('Update an invoice by ID.')
    .argument('<id>', 'Invoice ID')
    .option('--data <json>', 'JSON object or @path/to/file.json')
    .option('--name <text>', 'Invoice name')
    .option('--price <number>', 'Invoice total price', Number)
    .option('--contact-id <id>', 'Contact ID')
    .option('--contact-name <name>', 'Contact name')
    .option('--contact-email <email>', 'Contact email')
    .action(async (id: string, options: InvoiceOptions) => {
      const runtime = resolveRuntimeContext(invoices);

      let input: InvoiceUpdateInput;
      let contact: ContactInput | { id: string } | undefined;

      if (options.data !== undefined) {
        const raw = await parseDataInput(options.data);
        contact = parseContactFromData(raw);

        const { contact: _, ...invoiceData } = raw;
        input = safeParse(InvoiceUpdateInputSchema, invoiceData, 'invoice update input');
      } else {
        const hasAnyInvoiceFlag = options.name !== undefined || options.price !== undefined;
        const hasAnyContactFlag =
          options.contactId !== undefined || options.contactName !== undefined || options.contactEmail !== undefined;

        if (!hasAnyInvoiceFlag && !hasAnyContactFlag) {
          throw new Error(
            'Provide --data or at least one flag: --name, --price, --contact-id, --contact-name, --contact-email.',
          );
        }

        const invoiceRaw: UnknownRecord = {};
        if (options.name !== undefined) {
          invoiceRaw.name = options.name;
        }
        if (options.price !== undefined) {
          invoiceRaw.items = [{ unitPrice: options.price }];
        }
        input = safeParse(InvoiceUpdateInputSchema, invoiceRaw, 'invoice update input');
        contact = buildContactFromFlags(options, false);
      }

      await runtime.client.invoices.update(id, input, contact);
      printVoidAction(runtime.output, 'invoices.update', `Updated invoice ${id}.`);
    });

  invoices
    .command('delete')
    .description('Delete an invoice by ID.')
    .argument('<id>', 'Invoice ID')
    .action(async (id: string) => {
      const runtime = resolveRuntimeContext(invoices);
      await runtime.client.invoices.remove(id);
      printVoidAction(runtime.output, 'invoices.delete', `Deleted invoice ${id}.`);
    });

  invoices
    .command('pdf')
    .description('Download invoice PDF.')
    .argument('<id>', 'Invoice ID')
    .option('--path <file>', 'Output PDF path')
    .option('--language <code>', 'PDF language code (slo, cze, eng, ...)', 'slo')
    .action(async (id: string, options: { path?: string; language: string }) => {
      const runtime = resolveRuntimeContext(invoices);
      const language = safeParse(LanguageSchema, options.language, 'language');
      const pdf = await runtime.client.invoices.downloadPdf(id, language);

      const outputPath = options.path ?? `invoice-${id}.pdf`;
      await writeFile(outputPath, Buffer.from(pdf.data));

      printSuccess(runtime.output, 'invoices.pdf', {
        statusCode: pdf.statusCode,
        data: {
          path: outputPath,
          bytes: pdf.data.byteLength,
          contentType: pdf.contentType,
        },
      });
    });

  invoices
    .command('pay')
    .description('Pay an invoice by ID.')
    .argument('<id>', 'Invoice ID')
    .option('--data <json>', 'JSON object or @path/to/file.json')
    .action(async (id: string, options: { data?: string }) => {
      const runtime = resolveRuntimeContext(invoices);
      let paymentInput: InvoicePaymentInput | undefined;
      if (options.data !== undefined) {
        const raw = await parseDataInput(options.data);
        paymentInput = safeParse(InvoicePaymentInputSchema, raw, 'invoice payment input');
      }
      await runtime.client.invoices.pay(id, paymentInput);
      printVoidAction(runtime.output, 'invoices.pay', `Marked invoice ${id} as paid.`);
    });

  invoices
    .command('mark-sent')
    .description('Mark an invoice as sent by ID.')
    .argument('<id>', 'Invoice ID')
    .action(async (id: string) => {
      const runtime = resolveRuntimeContext(invoices);
      await runtime.client.invoices.markAsSent(id);
      printVoidAction(runtime.output, 'invoices.mark-sent', `Marked invoice ${id} as sent.`);
    });
}
