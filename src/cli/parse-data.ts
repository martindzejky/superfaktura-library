import { readFile } from 'node:fs/promises';
import { toRecord } from '../utils';
import type { UnknownRecord } from '../types';

export async function parseDataInput(value: string): Promise<UnknownRecord> {
  const raw = value.startsWith('@')
    ? await readFile(value.slice(1), 'utf8')
    : value;

  const parsed: unknown = JSON.parse(raw);
  const record = toRecord(parsed);
  if (!record) {
    throw new Error('Expected JSON object input.');
  }

  return record;
}
