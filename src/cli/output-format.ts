import { ApiError, HttpError, SchemaError, ValidationError } from '../core/errors';
import type { Result, UnknownRecord } from '../core/types';
import { normalizeErrorMessages, toRecord } from '../core/utils';
import type { OutputFormat } from './types';

export function printVoidAction(format: OutputFormat, action: string, message: string): void {
  if (format === 'json') {
    console.log(JSON.stringify({ ok: true, action }, null, 2));
    return;
  }
  console.log(message);
}

export function printSuccess(format: OutputFormat, action: string, result: Result<unknown>): void {
  if (format === 'json') {
    console.log(
      JSON.stringify(
        {
          ok: true,
          status: result.statusCode,
          action,
          data: result.data,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log('Success');
}

export function printError(format: OutputFormat, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Unknown error occurred.';
  const statusCode = getStatusCode(error);
  const errorData = getErrorData(error);
  const apiMessages = getApiMessages(errorData);
  const schemaDetails = error instanceof SchemaError ? error.details : undefined;
  const validationDetails = error instanceof ValidationError ? error.details : schemaDetails;
  const hasValidationDetails = validationDetails !== undefined && validationDetails.length > 0;
  const uniqueValidationDetails = validationDetails ? [...new Set(validationDetails)] : undefined;
  const apiMessagesWithoutDetails = uniqueValidationDetails
    ? apiMessages.filter((messageItem) => !uniqueValidationDetails.includes(messageItem))
    : apiMessages;
  const payloadForDisplay =
    errorData !== undefined && apiMessages.length === 0 ? JSON.stringify(errorData, null, 2) : undefined;

  if (format === 'json') {
    const errorObj: UnknownRecord = { message };
    if (apiMessagesWithoutDetails.length > 0) {
      errorObj.apiMessages = apiMessagesWithoutDetails;
    }
    if (hasValidationDetails && uniqueValidationDetails) {
      errorObj.details = uniqueValidationDetails;
    }
    if (errorData !== undefined) {
      errorObj.data = errorData;
    }

    const output: UnknownRecord = { ok: false };
    if (statusCode !== undefined) {
      output.status = statusCode;
    }
    output.error = errorObj;

    console.error(JSON.stringify(output, null, 2));
    return;
  }

  console.error('Error');
  console.error(message);
  if (statusCode !== undefined) {
    console.error(`Status: ${statusCode}`);
  }
  if (apiMessagesWithoutDetails.length > 0) {
    for (const apiMessage of apiMessagesWithoutDetails) {
      console.error(`API: ${apiMessage}`);
    }
  }
  if (hasValidationDetails && uniqueValidationDetails !== undefined) {
    for (const detail of uniqueValidationDetails) {
      console.error(`Detail: ${detail}`);
    }
  }
  if (payloadForDisplay !== undefined) {
    console.error(`Data: ${payloadForDisplay}`);
  }
}

function getStatusCode(error: unknown): number | undefined {
  if (error instanceof ApiError || error instanceof HttpError) {
    return error.statusCode;
  }
  return undefined;
}

function getErrorData(error: unknown): unknown {
  if (error instanceof ApiError || error instanceof HttpError) {
    return error.data;
  }
  return undefined;
}

function getApiMessages(errorData: unknown): string[] {
  const record = toRecord(errorData);
  if (!record) {
    return [];
  }

  const values: string[] = [];
  const errorMessageValues = normalizeErrorMessages(record.error_message);
  values.push(...errorMessageValues);

  const messageValues = normalizeErrorMessages(record.message);
  values.push(...messageValues);

  const nestedErrorMessageValues = normalizeErrorMessages(record.error_messages);
  values.push(...nestedErrorMessageValues);

  return [...new Set(values)];
}
