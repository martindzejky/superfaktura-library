import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import { parseDataInput } from '../parse-data';
import { resolveRuntimeContext } from '../runtime-context';
import { printSuccess } from '../output-format';
import type { Invoice, InvoiceInput } from '../../data/invoice';
import type { ContactInput } from '../../data/contact';
import type { InvoicePaymentInput } from '../../data/invoice-payment';
import type { ListResult, Result, UnknownRecord } from '../../core/types';
import { isRecord } from '../../core/utils';
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

  if (hasContactId) {
    return { id: options.contactId! };
  }

  const contact: UnknownRecord = {};
  if (options.contactName) contact.name = options.contactName;
  if (options.contactEmail) contact.email = options.contactEmail;
  return contact as unknown as ContactInput;
}

function buildInvoiceInputFromFlags(options: InvoiceOptions): InvoiceInput {
  if (options.price === undefined) {
    throw new Error('Provide --price or use --data for invoice create.');
  }

  const input: UnknownRecord = {
    items: [{ unitPrice: options.price }],
  };

  if (options.name !== undefined) {
    input.name = options.name;
  }

  return input as unknown as InvoiceInput;
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

function printVoidAction(output: OutputFormat, action: string, message: string): void {
  if (output === 'json') {
    console.log(JSON.stringify({ ok: true, action }, null, 2));
    return;
  }
  console.log(message);
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
        const contactData = isRecord(raw.contact) ? raw.contact : undefined;
        if (!contactData) {
          throw new Error('Missing "contact" in --data JSON.');
        }
        contact = contactData as unknown as ContactInput | { id: string };

        const { contact: _, ...invoiceData } = raw;
        input = invoiceData as unknown as InvoiceInput;
      } else {
        input = buildInvoiceInputFromFlags(options);
        const flagContact = buildContactFromFlags(options, true);
        if (!flagContact) {
          throw new Error('Missing contact data.');
        }
        contact = flagContact;
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

      let input: InvoiceInput;
      let contact: ContactInput | { id: string } | undefined;

      if (options.data !== undefined) {
        const raw = await parseDataInput(options.data);
        const contactData = isRecord(raw.contact) ? raw.contact : undefined;
        contact = contactData as unknown as ContactInput | { id: string } | undefined;

        const { contact: _, ...invoiceData } = raw;
        input = invoiceData as unknown as InvoiceInput;
      } else {
        if (options.name === undefined && options.price === undefined) {
          throw new Error(
            'Provide --data or at least one flag: --name, --price, --contact-id, --contact-name, --contact-email.',
          );
        }
        input = buildInvoiceInputFromFlags(options);
        contact = buildContactFromFlags(options, false);
      }

      const result = await runtime.client.invoices.update(id, input, contact);
      printInvoiceMutation(runtime.output, 'invoices.update', 'Updated', result);
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
      const language = LanguageSchema.parse(options.language);
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
        paymentInput = (await parseDataInput(options.data)) as unknown as InvoicePaymentInput;
      }
      await runtime.client.invoices.pay(id, paymentInput);
      printVoidAction(runtime.output, 'invoices.pay', `Marked invoice ${id} as paid.`);
    });

  invoices
    .command('mark-sent')
    .description('Toggle invoice sent flag by ID.')
    .argument('<id>', 'Invoice ID')
    .action(async (id: string) => {
      const runtime = resolveRuntimeContext(invoices);
      await runtime.client.invoices.markAsSent(id);
      printVoidAction(runtime.output, 'invoices.mark-sent', `Marked invoice ${id} as sent.`);
    });
}
