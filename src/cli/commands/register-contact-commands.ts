import { Command } from 'commander';
import { parseDataInput } from '../parse-data';
import { resolveRuntimeContext } from '../runtime-context';
import { printSuccess } from '../output-format';
import { toContactPayload } from '../../utils';

export function registerContactCommands(rootProgram: Command): void {
  const contacts = rootProgram.command('contacts').description('Manage contacts.');

  contacts
    .command('create')
    .description('Create a contact.')
    .requiredOption('--data <json>', 'JSON object or @path/to/file.json')
    .action(async (options: { data: string }) => {
      const runtime = resolveRuntimeContext(contacts);
      const payload = await parseDataInput(options.data);
      const result = await runtime.client.contacts.create(toContactPayload(payload));
      printSuccess(runtime.output, 'contacts.create', result);
    });

  contacts
    .command('get')
    .description('Get a contact by ID.')
    .argument('<id>', 'Contact ID', Number)
    .action(async (id: number) => {
      const runtime = resolveRuntimeContext(contacts);
      const result = await runtime.client.contacts.getById(id);
      printSuccess(runtime.output, 'contacts.get', result);
    });

  contacts
    .command('list')
    .description('List contacts.')
    .option('--page <number>', 'Page number', Number)
    .option('--per-page <number>', 'Items per page', Number)
    .option('--search <text>', 'Search text')
    .action(async (options: { page?: number; perPage?: number; search?: string }) => {
      const runtime = resolveRuntimeContext(contacts);
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
      const result = await runtime.client.contacts.list(query);
      printSuccess(runtime.output, 'contacts.list', result);
    });

  contacts
    .command('update')
    .description('Update a contact by ID.')
    .argument('<id>', 'Contact ID', Number)
    .requiredOption('--data <json>', 'JSON object or @path/to/file.json')
    .action(async (id: number, options: { data: string }) => {
      const runtime = resolveRuntimeContext(contacts);
      const payload = await parseDataInput(options.data);
      const result = await runtime.client.contacts.update(id, toContactPayload(payload));
      printSuccess(runtime.output, 'contacts.update', result);
    });

  contacts
    .command('delete')
    .description('Delete a contact by ID.')
    .argument('<id>', 'Contact ID', Number)
    .action(async (id: number) => {
      const runtime = resolveRuntimeContext(contacts);
      const result = await runtime.client.contacts.remove(id);
      printSuccess(runtime.output, 'contacts.delete', result);
    });
}
