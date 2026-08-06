import { readFile } from 'node:fs/promises';
import { toRecord } from '../core/utils';
import type { UnknownRecord } from '../core/types';

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function parseDataInput(value: string): Promise<UnknownRecord> {
  let raw: string;
  if (value === '-') {
    raw = await readStdin();
  } else if (value.startsWith('@')) {
    raw = await readFile(value.slice(1), 'utf8');
  } else {
    raw = value;
  }

  const parsed: unknown = JSON.parse(raw);
  const record = toRecord(parsed);
  if (!record) {
    throw new Error('Expected JSON object input.');
  }

  return record;
}
