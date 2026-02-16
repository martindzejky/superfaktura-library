import { Command } from 'commander';
import { parseDataInput } from '../parse-data';
import { resolveRuntimeContext } from '../runtime-context';
import { printSuccess } from '../output-format';
import type { ContactPayload, Result, UnknownRecord } from '../../types';
import { toRecord } from '../../utils';
import type { OutputFormat } from '../types';

interface ContactOptions {
  data?: string;
  name?: string;
  email?: string;
}

function buildContactPayloadFromFlags(options: ContactOptions, requireName: boolean): ContactPayload {
  if (requireName && (options.name === undefined || options.name.trim() === '')) {
    throw new Error('Provide --name or use --data for contact payload.');
  }

  const payload: UnknownRecord = {};
  if (options.name !== undefined) {
    payload.name = options.name;
  }
  if (options.email !== undefined) {
    payload.email = options.email;
  }

  if (Object.keys(payload).length === 0) {
    throw new Error('Provide --data or at least one flag: --name, --email.');
  }

  return payload as unknown as ContactPayload;
}

function printContactMutation(output: OutputFormat, action: string, verb: string, result: Result<UnknownRecord>): void {
  if (output === 'json') {
    printSuccess(output, action, result);
    return;
  }
  const nested = toRecord(result.data.data);
  const client = nested ? toRecord(nested.Client) : toRecord(result.data.Client);
  const id = client?.id ?? 'unknown';
  console.log(`${verb} contact with id ${id}.`);
}

function printContactDetail(output: OutputFormat, result: Result<UnknownRecord>): void {
  if (output === 'json') {
    printSuccess(output, 'contacts.get', result);
    return;
  }
  const client = toRecord(result.data.Client);
  if (!client) {
    console.log('No data.');
    return;
  }
  console.log(`id: ${client.id ?? ''}`);
  console.log(`name: ${client.name ?? ''}`);
  console.log(`email: ${client.email ?? ''}`);
}

function printContactList(output: OutputFormat, result: Result<UnknownRecord>): void {
  if (output === 'json') {
    printSuccess(output, 'contacts.list', result);
    return;
  }
  const data = result.data;
  const items = Array.isArray(data.items) ? data.items : [];

  if (items.length === 0) {
    console.log('No contacts.');
    return;
  }

  const itemCount = data.itemCount ?? items.length;
  const page = data.page ?? 1;
  console.log(`${itemCount} items, page ${page}`);

  for (const item of items) {
    const record = toRecord(item);
    const client = record ? toRecord(record.Client) : null;
    if (!client) continue;
    console.log(`${client.id ?? ''}, ${client.name ?? ''}, ${client.email ?? ''}`);
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
      let payload: ContactPayload;
      if (options.data !== undefined) {
        payload = (await parseDataInput(options.data)) as unknown as ContactPayload;
      } else {
        payload = buildContactPayloadFromFlags(options, true);
      }
      const result = await runtime.client.contacts.create(payload);
      printContactMutation(runtime.output, 'contacts.create', 'Created', result);
    });

  contacts
    .command('get')
    .description('Get a contact by ID.')
    .argument('<id>', 'Contact ID', Number)
    .action(async (id: number) => {
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
    .argument('<id>', 'Contact ID', Number)
    .option('--data <json>', 'JSON object or @path/to/file.json')
    .option('--name <name>', 'Contact name')
    .option('--email <email>', 'Contact email')
    .action(async (id: number, options: ContactOptions) => {
      const runtime = resolveRuntimeContext(contacts);
      let payload: ContactPayload;
      if (options.data !== undefined) {
        payload = (await parseDataInput(options.data)) as unknown as ContactPayload;
      } else {
        payload = buildContactPayloadFromFlags(options, false);
      }
      const result = await runtime.client.contacts.update(id, payload);
      printContactMutation(runtime.output, 'contacts.update', 'Updated', result);
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
