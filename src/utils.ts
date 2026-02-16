import { isArray, isNumber, isPlainObject, isString } from 'lodash-es';
import type { UnknownRecord } from './types';

export function isRecord(value: unknown): value is UnknownRecord {
  return isPlainObject(value);
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
  if (isNumber(value) && Number.isInteger(value)) {
    return value;
  }
  if (isString(value) && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }
  throw new Error('Invalid company ID value.');
}

export function normalizeErrorMessages(errorMessage: unknown): string[] {
  if (isArray(errorMessage)) {
    return errorMessage.filter((value): value is string => isString(value));
  }
  if (isString(errorMessage) && errorMessage.trim() !== '') {
    return [errorMessage];
  }
  return [];
}
