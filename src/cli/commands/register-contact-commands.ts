import { Command } from 'commander';
import { parseDataInput } from '../parse-data';
import { resolveRuntimeContext } from '../runtime-context';
import { printSuccess, printVoidAction } from '../output-format';
import type { Contact, ContactInput, ContactUpdateInput } from '../../data/contact';
import { ContactInputSchema, ContactUpdateInputSchema } from '../../data/contact';
import type { ListResult, Result, UnknownRecord } from '../../core/types';
import { safeParse } from '../../core/utils';
import type { OutputFormat } from '../types';

interface ContactOptions {
  data?: string;
  name?: string;
  email?: string;
}

function buildContactCreateInput(options: ContactOptions): ContactInput {
  if (options.name === undefined || options.name.trim() === '') {
    throw new Error('Provide --name or use --data for contact payload.');
  }

  const raw: UnknownRecord = { name: options.name };
  if (options.email !== undefined) {
    raw.email = options.email;
  }

  return safeParse(ContactInputSchema, raw, 'contact input');
}

function buildContactUpdateInput(options: ContactOptions): ContactUpdateInput {
  const raw: UnknownRecord = {};
  if (options.name !== undefined) {
    raw.name = options.name;
  }
  if (options.email !== undefined) {
    raw.email = options.email;
  }

  if (Object.keys(raw).length === 0) {
    throw new Error('Provide --data or at least one flag: --name, --email.');
  }

  return safeParse(ContactUpdateInputSchema, raw, 'contact update input');
}

function printContactMutation(output: OutputFormat, action: string, verb: string, result: Result<Contact>): void {
  if (output === 'json') {
    printSuccess(output, action, result);
    return;
  }
  console.log(`${verb} contact with id ${result.data.id}.`);
}

function printContactDetail(output: OutputFormat, result: Result<Contact>): void {
  if (output === 'json') {
    printSuccess(output, 'contacts.get', result);
    return;
  }
  const contact = result.data;
  console.log(`id: ${contact.id}`);
  console.log(`name: ${contact.name}`);
  console.log(`email: ${contact.email ?? ''}`);
}

function printContactList(output: OutputFormat, result: ListResult<Contact>): void {
  if (output === 'json') {
    printSuccess(output, 'contacts.list', { statusCode: result.statusCode, data: result });
    return;
  }

  if (result.items.length === 0) {
    console.log('No contacts.');
    return;
  }

  console.log(`${result.itemCount} items, page ${result.page}`);

  for (const contact of result.items) {
    console.log(`${contact.id}, ${contact.name}, ${contact.email ?? ''}`);
  }
}

export function registerContactCommands(rootProgram: Command): void {
  const contacts = rootProgram.command('contacts').description('Manage contacts.');

  contacts
    .command('create')
    .description('Create a contact.')
    .option('--data <json>', 'JSON object or @path/to/file.json')
    .option('--name <name>', 'Contact name')
    .option('--email <email>', 'Contact email')
    .action(async (options: ContactOptions) => {
      const runtime = resolveRuntimeContext(contacts);
      let input: ContactInput;
      if (options.data !== undefined) {
        const raw = await parseDataInput(options.data);
        input = safeParse(ContactInputSchema, raw, 'contact input');
      } else {
        input = buildContactCreateInput(options);
      }
      const result = await runtime.client.contacts.create(input);
      printContactMutation(runtime.output, 'contacts.create', 'Created', result);
    });

  contacts
    .command('get')
    .description('Get a contact by ID.')
    .argument('<id>', 'Contact ID')
    .action(async (id: string) => {
      const runtime = resolveRuntimeContext(contacts);
      const result = await runtime.client.contacts.getById(id);
      printContactDetail(runtime.output, result);
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
      printContactList(runtime.output, result);
    });

  contacts
    .command('update')
    .description('Update a contact by ID.')
    .argument('<id>', 'Contact ID')
    .option('--data <json>', 'JSON object or @path/to/file.json')
    .option('--name <name>', 'Contact name')
    .option('--email <email>', 'Contact email')
    .action(async (id: string, options: ContactOptions) => {
      const runtime = resolveRuntimeContext(contacts);
      let input: ContactUpdateInput;
      if (options.data !== undefined) {
        const raw = await parseDataInput(options.data);
        input = safeParse(ContactUpdateInputSchema, raw, 'contact update input');
      } else {
        input = buildContactUpdateInput(options);
      }
      await runtime.client.contacts.update(id, input);
      printVoidAction(runtime.output, 'contacts.update', `Updated contact ${id}.`);
    });

  contacts
    .command('delete')
    .description('Delete a contact by ID.')
    .argument('<id>', 'Contact ID')
    .action(async (id: string) => {
      const runtime = resolveRuntimeContext(contacts);
      await runtime.client.contacts.remove(id);
      printVoidAction(runtime.output, 'contacts.delete', `Deleted contact ${id}.`);
    });
}
