import { Command } from 'commander';
import { writeFile } from 'node:fs/promises';
import { parseDataInput } from '../parse-data';
import { resolveRuntimeContext } from '../runtime-context';
import { printSuccess } from '../output-format';
import type { InvoicePaymentPayload } from '../../types';
import { toInvoiceCreatePayload, toInvoicePaymentPayload, toInvoiceUpdatePayload } from '../../utils';

export function registerInvoiceCommands(rootProgram: Command): void {
  const invoices = rootProgram.command('invoices').description('Manage invoices.');

  invoices
    .command('create')
    .description('Create an invoice.')
    .requiredOption('--data <json>', 'JSON object or @path/to/file.json')
    .action(async (options: { data: string }) => {
      const runtime = resolveRuntimeContext(invoices);
      const payload = await parseDataInput(options.data);
      const result = await runtime.client.invoices.create(toInvoiceCreatePayload(payload));
      printSuccess(runtime.output, 'invoices.create', result);
    });

  invoices
    .command('get')
    .description('Get an invoice by ID.')
    .argument('<id>', 'Invoice ID', Number)
    .action(async (id: number) => {
      const runtime = resolveRuntimeContext(invoices);
      const result = await runtime.client.invoices.getById(id);
      printSuccess(runtime.output, 'invoices.get', result);
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
      printSuccess(runtime.output, 'invoices.list', result);
    });

  invoices
    .command('update')
    .description('Update an invoice by ID.')
    .argument('<id>', 'Invoice ID', Number)
    .requiredOption('--data <json>', 'JSON object or @path/to/file.json')
    .action(async (id: number, options: { data: string }) => {
      const runtime = resolveRuntimeContext(invoices);
      const payload = await parseDataInput(options.data);
      const result = await runtime.client.invoices.update(toInvoiceUpdatePayload(id, payload));
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
    .option('--language <code>', 'PDF language code', 'sk')
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
        paymentPayload = toInvoicePaymentPayload(payload);
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
