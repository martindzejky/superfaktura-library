import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import { parseDataInput } from '../parse-data';
import { resolveRuntimeContext } from '../runtime-context';
import { printSuccess, printVoidAction } from '../output-format';
import { addCommandHelp } from '../help-text';
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
      throw new Error(
        [
          'Provide --contact-id or --contact-name or --contact-email, or use --data.',
          '  superfaktura invoices create --price 120 --contact-id 123',
          '  superfaktura invoices create --price 120 --contact-name "ACME s.r.o." --contact-email "billing@acme.test"',
        ].join('\n'),
      );
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

  const create = invoices
    .command('create')
    .description('Create an invoice.')
    .option('--data <json>', 'JSON object, @path/to/file.json, or - for stdin')
    .option('--name <text>', 'Invoice name')
    .option('--price <number>', 'Unit price without VAT for a single item', Number)
    .option('--contact-id <id>', 'Contact ID')
    .option('--contact-name <name>', 'Contact name')
    .option('--contact-email <email>', 'Contact email')
    .action(async (options: InvoiceOptions) => {
      let input: InvoiceInput;
      let contact: ContactInput | { id: string };

      if (options.data !== undefined) {
        const raw = await parseDataInput(options.data);
        const parsedContact = parseContactFromData(raw);
        if (parsedContact === undefined) {
          throw new Error(
            [
              'Missing "contact" in --data JSON.',
              '  superfaktura invoices create --data \'{"items":[{"unitPrice":120}],"contact":{"id":"123"}}\'',
              '  superfaktura invoices create --data @./invoice-create.json',
            ].join('\n'),
          );
        }
        contact = parsedContact;

        const { contact: _, ...invoiceData } = raw;
        input = safeParse(InvoiceInputSchema, invoiceData, 'invoice input');
      } else {
        if (options.price === undefined) {
          throw new Error(
            [
              'Provide --price or use --data for invoice create.',
              '  superfaktura invoices create --price 120 --contact-id 123',
              '  superfaktura invoices create --data @./invoice-create.json',
            ].join('\n'),
          );
        }

        const flagContact = buildContactFromFlags(options, true);
        if (flagContact === undefined) {
          throw new Error(
            ['Missing contact data.', '  superfaktura invoices create --price 120 --contact-id 123'].join('\n'),
          );
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

      const runtime = resolveRuntimeContext(invoices);
      const result = await runtime.client.invoices.create(input, contact);
      printInvoiceMutation(runtime.output, 'invoices.create', 'Created', result);
    });
  addCommandHelp(create, {
    dataShape: '{"name":"Invoice 2026-001","items":[{"unitPrice":120}],"contact":{"id":"123"}}',
    examples: [
      'superfaktura invoices create --price 120 --contact-id 123',
      'superfaktura invoices create --price 120 --contact-name "ACME s.r.o." --contact-email "billing@acme.test"',
      'superfaktura invoices create --data @./invoice-create.json',
      'cat ./invoice-create.json | superfaktura invoices create --data -',
    ],
  });

  const get = invoices
    .command('get')
    .description('Get an invoice by ID.')
    .argument('<id>', 'Invoice ID')
    .action(async (id: string) => {
      const runtime = resolveRuntimeContext(invoices);
      const result = await runtime.client.invoices.getById(id);
      printInvoiceDetail(runtime.output, result);
    });
  addCommandHelp(get, {
    examples: ['superfaktura invoices get 123', 'superfaktura invoices get 123 --output json'],
  });

  const list = invoices
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
  addCommandHelp(list, {
    examples: [
      'superfaktura invoices list',
      'superfaktura invoices list --page 1 --per-page 10 --search 2026',
      'superfaktura invoices list --output json',
    ],
  });

  const update = invoices
    .command('update')
    .description('Update an invoice by ID.')
    .argument('<id>', 'Invoice ID')
    .option('--data <json>', 'JSON object, @path/to/file.json, or - for stdin')
    .option('--name <text>', 'Invoice name')
    .option('--price <number>', 'Unit price without VAT for a single item', Number)
    .option('--contact-id <id>', 'Contact ID')
    .option('--contact-name <name>', 'Contact name')
    .option('--contact-email <email>', 'Contact email')
    .action(async (id: string, options: InvoiceOptions) => {
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
            [
              'Provide --data or at least one flag: --name, --price, --contact-id, --contact-name, --contact-email.',
              '  superfaktura invoices update 123 --name "New name"',
              '  superfaktura invoices update 123 --data @./invoice-update.json',
            ].join('\n'),
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

      const runtime = resolveRuntimeContext(invoices);
      await runtime.client.invoices.update(id, input, contact);
      printVoidAction(runtime.output, 'invoices.update', `Updated invoice ${id}.`);
    });
  addCommandHelp(update, {
    dataShape: '{"name":"New name","items":[{"unitPrice":150}],"contact":{"id":"123"}}',
    examples: [
      'superfaktura invoices update 123 --name "New name"',
      'superfaktura invoices update 123 --price 150',
      'superfaktura invoices update 123 --data @./invoice-update.json',
    ],
  });

  const remove = invoices
    .command('delete')
    .description('Delete an invoice by ID.')
    .argument('<id>', 'Invoice ID')
    .action(async (id: string) => {
      const runtime = resolveRuntimeContext(invoices);
      await runtime.client.invoices.remove(id);
      printVoidAction(runtime.output, 'invoices.delete', `Deleted invoice ${id}.`);
    });
  addCommandHelp(remove, {
    examples: ['superfaktura invoices delete 123'],
  });

  const pdf = invoices
    .command('pdf')
    .description('Download invoice PDF.')
    .argument('<id>', 'Invoice ID')
    .option('--path <file>', 'Output PDF path')
    .option('--language <code>', 'PDF language code (slo, cze, eng, ...)', 'slo')
    .action(async (id: string, options: { path?: string; language: string }) => {
      const language = safeParse(LanguageSchema, options.language, 'language');
      const runtime = resolveRuntimeContext(invoices);
      const pdfResult = await runtime.client.invoices.downloadPdf(id, language);

      const outputPath = options.path ?? `invoice-${id}.pdf`;
      await writeFile(outputPath, Buffer.from(pdfResult.data));

      printSuccess(runtime.output, 'invoices.pdf', {
        statusCode: pdfResult.statusCode,
        data: {
          path: outputPath,
          bytes: pdfResult.data.byteLength,
          contentType: pdfResult.contentType,
        },
      });
    });
  addCommandHelp(pdf, {
    examples: [
      'superfaktura invoices pdf 123',
      'superfaktura invoices pdf 123 --path ./invoice-123.pdf --language eng',
    ],
  });

  const pay = invoices
    .command('pay')
    .description('Pay an invoice by ID.')
    .argument('<id>', 'Invoice ID')
    .option('--data <json>', 'JSON object, @path/to/file.json, or - for stdin')
    .option('--amount <number>', 'Payment amount', Number)
    .option('--payment-type <type>', 'Payment type (transfer, cash, card, ...)')
    .action(async (id: string, options: { data?: string; amount?: number; paymentType?: string }) => {
      let paymentInput: InvoicePaymentInput | undefined;
      if (options.data !== undefined) {
        const raw = await parseDataInput(options.data);
        paymentInput = safeParse(InvoicePaymentInputSchema, raw, 'invoice payment input');
      } else if (options.amount !== undefined || options.paymentType !== undefined) {
        const raw: UnknownRecord = {};
        if (options.amount !== undefined) {
          raw.amount = options.amount;
        }
        if (options.paymentType !== undefined) {
          raw.paymentType = options.paymentType;
        }
        paymentInput = safeParse(InvoicePaymentInputSchema, raw, 'invoice payment input');
      }
      const runtime = resolveRuntimeContext(invoices);
      await runtime.client.invoices.pay(id, paymentInput);
      printVoidAction(runtime.output, 'invoices.pay', `Marked invoice ${id} as paid.`);
    });
  addCommandHelp(pay, {
    dataShape: '{"amount":100,"paymentType":"transfer"}',
    examples: [
      'superfaktura invoices pay 123',
      'superfaktura invoices pay 123 --amount 100 --payment-type transfer',
      'superfaktura invoices pay 123 --data \'{"amount":100,"paymentType":"transfer"}\'',
    ],
  });

  const markSent = invoices
    .command('mark-sent')
    .description('Set invoice sent state by ID.')
    .argument('<id>', 'Invoice ID')
    .requiredOption('--sent <boolean>', 'Desired sent state: true or false')
    .action(async (id: string, options: { sent: string }) => {
      const sent = parseBooleanFlag(options.sent, '--sent');
      const runtime = resolveRuntimeContext(invoices);
      const result = await runtime.client.invoices.markAsSent(id, sent);
      if (runtime.output === 'json') {
        printSuccess(runtime.output, 'invoices.mark-sent', {
          statusCode: result.statusCode,
          data: { id, marked: result.data.marked },
        });
        return;
      }
      console.log(`Invoice ${id} sent state is ${result.data.marked}.`);
    });
  addCommandHelp(markSent, {
    examples: ['superfaktura invoices mark-sent 123 --sent true', 'superfaktura invoices mark-sent 123 --sent false'],
  });
}

function parseBooleanFlag(value: string, flagName: string): boolean {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  throw new Error(
    [`Invalid ${flagName}. Use true or false.`, `  superfaktura invoices mark-sent 123 --sent true`].join('\n'),
  );
}
