import type { ZodType } from 'zod';
import { SchemaError } from './errors';
import type { UnknownRecord } from './types';

export function nullToUndefined<T>(value: T | null): T | undefined {
  return value === null ? undefined : value;
}

export function emptyToUndefined(value: string | null): string | undefined {
  if (value === null || value === '') {
    return undefined;
  }
  return value;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function safeParseFloat(value: string, label: string): number {
  const parsed = parseFloat(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value for ${label}: "${value}"`);
  }
  return parsed;
}

export function safeParseInt(value: string, label: string): number {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer value for ${label}: "${value}"`);
  }
  return parsed;
}

export function safeParseDate(value: string, label: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date value for ${label}: "${value}"`);
  }
  return date;
}

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

export function safeParse<T>(schema: ZodType<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new SchemaError(label, result.error);
  }
  return result.data;
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
