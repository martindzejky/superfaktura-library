import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import { parseDataInput } from '../parse-data';
import { resolveRuntimeContext } from '../runtime-context';
import { printSuccess } from '../output-format';
import type {
  InvoiceCreatePayload,
  InvoicePaymentPayload,
  InvoiceUpdatePayload,
  Result,
  UnknownRecord,
} from '../../types';
import { toRecord } from '../../utils';
import type { OutputFormat } from '../types';

interface InvoiceOptions {
  data?: string;
  name?: string;
  price?: number;
  contactId?: number;
  contactName?: string;
  contactEmail?: string;
}

function buildInvoiceContactFromFlags(options: InvoiceOptions, requireContact: boolean): UnknownRecord | undefined {
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
    return { id: options.contactId };
  }

  const contactPayload: UnknownRecord = {};

  if (options.contactName !== undefined) {
    contactPayload.name = options.contactName;
  }
  if (options.contactEmail !== undefined) {
    contactPayload.email = options.contactEmail;
  }

  return contactPayload;
}

function buildInvoiceCreatePayloadFromFlags(options: InvoiceOptions): InvoiceCreatePayload {
  if (options.price === undefined) {
    throw new Error('Provide --price or use --data for invoice create.');
  }

  const contact = buildInvoiceContactFromFlags(options, true);
  if (contact === undefined) {
    throw new Error('Missing contact data.');
  }

  const payload: UnknownRecord = {
    contact,
    items: [{ unit_price: options.price }],
  };

  if (options.name !== undefined) {
    payload.invoice = {
      name: options.name,
    };
  }

  return payload as unknown as InvoiceCreatePayload;
}

function buildInvoiceUpdatePayloadFromFlags(id: number, options: InvoiceOptions): InvoiceUpdatePayload {
  const payload: UnknownRecord = { id };

  if (options.name !== undefined) {
    payload.invoice = {
      name: options.name,
    };
  }

  if (options.price !== undefined) {
    payload.items = [{ unit_price: options.price }];
  }

  const contact = buildInvoiceContactFromFlags(options, false);
  if (contact !== undefined) {
    payload.contact = contact;
  }

  if (Object.keys(payload).length === 1) {
    throw new Error(
      'Provide --data or at least one flag: --name, --price, --contact-id, --contact-name, --contact-email.',
    );
  }

  return payload as unknown as InvoiceUpdatePayload;
}

function printInvoiceDetail(output: OutputFormat, result: Result<UnknownRecord>): void {
  if (output === 'json') {
    printSuccess(output, 'invoices.get', result);
    return;
  }
  const data = result.data;
  const invoice = toRecord(data.Invoice);
  const summary = toRecord(data['0']);
  const client = toRecord(data.Client);

  if (!invoice) {
    console.log('No data.');
    return;
  }

  console.log(`id: ${invoice.id ?? ''}`);
  console.log(`name: ${invoice.name ?? ''}`);
  console.log(`total: ${summary?.total ?? ''}`);
  console.log(`contact_id: ${client?.id ?? ''}`);
  console.log(`contact_name: ${client?.name ?? ''}`);
  console.log(`contact_email: ${client?.email ?? ''}`);
}

function printInvoiceList(output: OutputFormat, result: Result<UnknownRecord>): void {
  if (output === 'json') {
    printSuccess(output, 'invoices.list', result);
    return;
  }
  const data = result.data;
  const items = Array.isArray(data.items) ? data.items : [];

  if (items.length === 0) {
    console.log('No invoices.');
    return;
  }

  const itemCount = data.itemCount ?? items.length;
  const page = data.page ?? 1;
  console.log(`${itemCount} items, page ${page}`);

  for (const item of items) {
    const record = toRecord(item);
    if (!record) continue;
    const invoice = toRecord(record.Invoice);
    const summary = toRecord(record['0']);
    const client = toRecord(record.Client);
    if (!invoice) continue;
    console.log(
      `${invoice.id ?? ''}, ${invoice.name ?? ''}, ${summary?.total ?? ''}, ${client?.name ?? ''}, ${client?.email ?? ''}`,
    );
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
    .option('--contact-id <id>', 'Contact ID', Number)
    .option('--contact-name <name>', 'Contact name')
    .option('--contact-email <email>', 'Contact email')
    .action(async (options: InvoiceOptions) => {
      const runtime = resolveRuntimeContext(invoices);
      let payload: InvoiceCreatePayload;
      if (options.data !== undefined) {
        payload = (await parseDataInput(options.data)) as unknown as InvoiceCreatePayload;
      } else {
        payload = buildInvoiceCreatePayloadFromFlags(options);
      }
      const result = await runtime.client.invoices.create(payload);
      printSuccess(runtime.output, 'invoices.create', result);
    });

  invoices
    .command('get')
    .description('Get an invoice by ID.')
    .argument('<id>', 'Invoice ID', Number)
    .action(async (id: number) => {
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
    .argument('<id>', 'Invoice ID', Number)
    .option('--data <json>', 'JSON object or @path/to/file.json')
    .option('--name <text>', 'Invoice name')
    .option('--price <number>', 'Invoice total price', Number)
    .option('--contact-id <id>', 'Contact ID', Number)
    .option('--contact-name <name>', 'Contact name')
    .option('--contact-email <email>', 'Contact email')
    .action(async (id: number, options: InvoiceOptions) => {
      const runtime = resolveRuntimeContext(invoices);
      let payload: InvoiceUpdatePayload;
      if (options.data !== undefined) {
        payload = {
          ...((await parseDataInput(options.data)) as unknown as InvoiceUpdatePayload),
          id,
        };
      } else {
        payload = buildInvoiceUpdatePayloadFromFlags(id, options);
      }
      const result = await runtime.client.invoices.update(payload);
      printSuccess(runtime.output, 'invoices.update', result);
    });

  invoices
    .command('delete')
    .description('Delete an invoice by ID.')
    .argument('<id>', 'Invoice ID', Number)
    .action(async (id: number) => {
      const runtime = resolveRuntimeContext(invoices);
      const result = await runtime.client.invoices.remove(id);
      printSuccess(runtime.output, 'invoices.delete', result);
    });

  invoices
    .command('pdf')
    .description('Download invoice PDF.')
    .argument('<id>', 'Invoice ID', Number)
    .option('--path <file>', 'Output PDF path')
    .option('--language <code>', 'PDF language code (slo, cze, eng, ...)', 'slo')
    .action(async (id: number, options: { path?: string; language: string }) => {
      const runtime = resolveRuntimeContext(invoices);
      const pdf = await runtime.client.invoices.downloadPdf(id, options.language);

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
    .argument('<id>', 'Invoice ID', Number)
    .option('--data <json>', 'JSON object or @path/to/file.json')
    .action(async (id: number, options: { data?: string }) => {
      const runtime = resolveRuntimeContext(invoices);
      let paymentPayload: InvoicePaymentPayload | undefined;
      if (options.data !== undefined) {
        const payload = await parseDataInput(options.data);
        paymentPayload = payload as unknown as InvoicePaymentPayload;
      }
      const result = await runtime.client.invoices.pay(id, paymentPayload);
      printSuccess(runtime.output, 'invoices.pay', result);
    });

  invoices
    .command('mark-sent')
    .description('Toggle invoice sent flag by ID.')
    .argument('<id>', 'Invoice ID', Number)
    .action(async (id: number) => {
      const runtime = resolveRuntimeContext(invoices);
      const result = await runtime.client.invoices.markAsSent(id);
      printSuccess(runtime.output, 'invoices.mark-sent', result);
    });
}
