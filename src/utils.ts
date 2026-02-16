import type { UnknownRecord } from './types';

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toRecord(value: unknown): UnknownRecord | null {
  if (!isRecord(value)) {
    return null;
  }
  return value;
}

export function parseCompanyId(value: string | number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }
  throw new Error('Invalid company ID value.');
}

export function normalizeErrorMessages(errorMessage: unknown): string[] {
  if (Array.isArray(errorMessage)) {
    return errorMessage.filter((value): value is string => typeof value === 'string');
  }
  if (typeof errorMessage === 'string' && errorMessage.trim() !== '') {
    return [errorMessage];
  }
  return [];
}
