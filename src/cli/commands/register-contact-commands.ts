import { Command } from 'commander';
import { parseDataInput } from '../parse-data';
import { resolveRuntimeContext } from '../runtime-context';
import { printSuccess, printVoidAction } from '../output-format';
import { addCommandHelp } from '../help-text';
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
    throw new Error(
      [
        'Provide --name or use --data for contact payload.',
        '  superfaktura contacts create --name "ACME s.r.o." --email "billing@acme.test"',
        '  superfaktura contacts create --data \'{"name":"ACME s.r.o.","email":"billing@acme.test"}\'',
      ].join('\n'),
    );
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
    throw new Error(
      [
        'Provide --data or at least one flag: --name, --email.',
        '  superfaktura contacts update 123 --email "new-email@acme.test"',
        '  superfaktura contacts update 123 --data \'{"email":"new-email@acme.test"}\'',
      ].join('\n'),
    );
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

  const create = contacts
    .command('create')
    .description('Create a contact.')
    .option('--data <json>', 'JSON object or @path/to/file.json')
    .option('--name <name>', 'Contact name')
    .option('--email <email>', 'Contact email')
    .action(async (options: ContactOptions) => {
      let input: ContactInput;
      if (options.data !== undefined) {
        const raw = await parseDataInput(options.data);
        input = safeParse(ContactInputSchema, raw, 'contact input');
      } else {
        input = buildContactCreateInput(options);
      }
      const runtime = resolveRuntimeContext(contacts);
      const result = await runtime.client.contacts.create(input);
      printContactMutation(runtime.output, 'contacts.create', 'Created', result);
    });
  addCommandHelp(create, {
    examples: [
      'superfaktura contacts create --name "ACME s.r.o." --email "billing@acme.test"',
      'superfaktura contacts create --data \'{"name":"ACME s.r.o.","email":"billing@acme.test"}\'',
      'superfaktura contacts create --data @./contact.json',
    ],
  });

  const get = contacts
    .command('get')
    .description('Get a contact by ID.')
    .argument('<id>', 'Contact ID')
    .action(async (id: string) => {
      const runtime = resolveRuntimeContext(contacts);
      const result = await runtime.client.contacts.getById(id);
      printContactDetail(runtime.output, result);
    });
  addCommandHelp(get, {
    examples: ['superfaktura contacts get 123', 'superfaktura contacts get 123 --output json'],
  });

  const list = contacts
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
  addCommandHelp(list, {
    examples: [
      'superfaktura contacts list',
      'superfaktura contacts list --page 1 --per-page 10 --search ACME',
      'superfaktura contacts list --output json',
    ],
  });

  const update = contacts
    .command('update')
    .description('Update a contact by ID.')
    .argument('<id>', 'Contact ID')
    .option('--data <json>', 'JSON object or @path/to/file.json')
    .option('--name <name>', 'Contact name')
    .option('--email <email>', 'Contact email')
    .action(async (id: string, options: ContactOptions) => {
      let input: ContactUpdateInput;
      if (options.data !== undefined) {
        const raw = await parseDataInput(options.data);
        input = safeParse(ContactUpdateInputSchema, raw, 'contact update input');
      } else {
        input = buildContactUpdateInput(options);
      }
      const runtime = resolveRuntimeContext(contacts);
      await runtime.client.contacts.update(id, input);
      printVoidAction(runtime.output, 'contacts.update', `Updated contact ${id}.`);
    });
  addCommandHelp(update, {
    examples: [
      'superfaktura contacts update 123 --email "new-email@acme.test"',
      'superfaktura contacts update 123 --data \'{"email":"new-email@acme.test"}\'',
      'superfaktura contacts update 123 --data @./contact-update.json',
    ],
  });

  const remove = contacts
    .command('delete')
    .description('Delete a contact by ID.')
    .argument('<id>', 'Contact ID')
    .action(async (id: string) => {
      const runtime = resolveRuntimeContext(contacts);
      await runtime.client.contacts.remove(id);
      printVoidAction(runtime.output, 'contacts.delete', `Deleted contact ${id}.`);
    });
  addCommandHelp(remove, {
    examples: ['superfaktura contacts delete 123'],
  });
}
