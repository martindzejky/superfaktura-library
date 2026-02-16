import {
  isArray,
  isBoolean,
  isNull,
  isNumber,
  isPlainObject,
  isString,
} from 'lodash-es';
import type {
  ContactPayload,
  InvoiceCreatePayload,
  InvoiceItemPayload,
  InvoiceUpdatePayload,
  ScalarValue,
  UnknownRecord,
} from './types';

function isScalarValue(value: unknown): value is ScalarValue {
  return (
    value === undefined ||
    isString(value) ||
    isNumber(value) ||
    isBoolean(value) ||
    isNull(value)
  );
}

export function isRecord(value: unknown): value is UnknownRecord {
  return isPlainObject(value);
}

export function toRecord(value: unknown): UnknownRecord | null {
  if (!isRecord(value)) {
    return null;
  }
  return value;
}

export function parseCompanyId(
  value: string | number | undefined,
): number | undefined {
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

export function toContactPayload(value: UnknownRecord): ContactPayload {
  if (!isRecord(value)) {
    throw new Error('Contact payload must be an object.');
  }

  const name = value.name;
  if (!isString(name) || name.trim() === '') {
    throw new Error('Contact payload must contain non-empty "name".');
  }

  const validatedEntries: Array<[string, ScalarValue]> = [];
  for (const [key, entryValue] of Object.entries(value)) {
    if (!isScalarValue(entryValue)) {
      throw new Error(`Invalid contact field "${key}".`);
    }
    validatedEntries.push([key, entryValue]);
  }

  return {
    name,
    ...Object.fromEntries(validatedEntries),
  };
}

function toInvoiceContactPayload(value: unknown): ContactPayload {
  if (!isRecord(value)) {
    throw new Error('Invoice payload must include contact object.');
  }

  const name = value.name;
  if (!isString(name) || name.trim() === '') {
    throw new Error('Invoice contact must include non-empty "name".');
  }

  const entries: Array<[string, ScalarValue]> = [];
  for (const [key, entryValue] of Object.entries(value)) {
    if (!isScalarValue(entryValue)) {
      throw new Error(`Invalid contact field "${key}".`);
    }
    entries.push([key, entryValue]);
  }

  return {
    name,
    ...Object.fromEntries(entries),
  };
}

function toInvoiceItemPayload(
  item: unknown,
  index: number,
): InvoiceItemPayload {
  if (!isRecord(item)) {
    throw new Error(`Invoice item at index ${index} must be an object.`);
  }

  const entries: Array<[string, ScalarValue]> = [];
  for (const [key, entryValue] of Object.entries(item)) {
    if (!isScalarValue(entryValue)) {
      throw new Error(`Invalid invoice item field "${key}" at index ${index}.`);
    }
    entries.push([key, entryValue]);
  }

  return Object.fromEntries(entries);
}

function toOptionalRecord(
  value: unknown,
  fieldName: string,
): UnknownRecord | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isRecord(value)) {
    throw new Error(`"${fieldName}" must be an object.`);
  }
  return value;
}

function toOptionalTags(value: unknown): number[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!isArray(value) || !value.every((item) => isNumber(item))) {
    throw new Error('"tags" must be an array of numbers.');
  }
  return value;
}

export function toInvoiceCreatePayload(
  value: UnknownRecord,
): InvoiceCreatePayload {
  const rawItems = value.items;
  if (!isArray(rawItems) || rawItems.length === 0) {
    throw new Error('Invoice payload must include non-empty items array.');
  }

  const contact = toInvoiceContactPayload(value.contact);
  const items = rawItems.map((item, index) =>
    toInvoiceItemPayload(item, index),
  );

  const payload: InvoiceCreatePayload = {
    contact,
    items,
  };

  const invoice = toOptionalRecord(value.invoice, 'invoice');
  if (invoice) {
    payload.invoice = invoice;
  }
  const settings = toOptionalRecord(value.settings, 'settings');
  if (settings) {
    payload.settings = settings;
  }
  const extra = toOptionalRecord(value.extra, 'extra');
  if (extra) {
    payload.extra = extra;
  }
  const myData = toOptionalRecord(value.myData, 'myData');
  if (myData) {
    payload.myData = myData;
  }
  const tags = toOptionalTags(value.tags);
  if (tags) {
    payload.tags = tags;
  }

  return payload;
}

export function toInvoiceUpdatePayload(
  id: number,
  value: UnknownRecord,
): InvoiceUpdatePayload {
  const payload: InvoiceUpdatePayload = { id };

  if (value.contact !== undefined) {
    payload.contact = toInvoiceContactPayload(value.contact);
  }
  if (value.items !== undefined) {
    if (!isArray(value.items)) {
      throw new Error('"items" must be an array when provided.');
    }
    payload.items = value.items.map((item, index) =>
      toInvoiceItemPayload(item, index),
    );
  }

  const invoice = toOptionalRecord(value.invoice, 'invoice');
  if (invoice) {
    payload.invoice = invoice;
  }
  const settings = toOptionalRecord(value.settings, 'settings');
  if (settings) {
    payload.settings = settings;
  }
  const extra = toOptionalRecord(value.extra, 'extra');
  if (extra) {
    payload.extra = extra;
  }
  const myData = toOptionalRecord(value.myData, 'myData');
  if (myData) {
    payload.myData = myData;
  }
  const tags = toOptionalTags(value.tags);
  if (tags) {
    payload.tags = tags;
  }

  if (
    payload.contact === undefined &&
    payload.items === undefined &&
    payload.invoice === undefined &&
    payload.settings === undefined &&
    payload.extra === undefined &&
    payload.myData === undefined &&
    payload.tags === undefined
  ) {
    throw new Error('Invoice update payload is empty.');
  }

  return payload;
}
