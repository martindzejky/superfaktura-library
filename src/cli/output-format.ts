import pc from 'picocolors';
import { isError } from 'lodash-es';
import { ApiError, HttpError, ValidationError } from '../errors';
import type { Result } from '../types';
import { normalizeErrorMessages, toRecord } from '../utils';
import type { OutputFormat } from './types';

export function printSuccess(format: OutputFormat, action: string, result: Result<unknown>): void {
  if (format === 'json') {
    console.log(
      JSON.stringify(
        {
          ok: true,
          action,
          data: result.data,
          meta: {
            statusCode: result.statusCode,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(pc.green('Success'));
  console.log(`${pc.bold('Action:')} ${action}`);
  console.log(`${pc.bold('Status:')} ${result.statusCode}`);
  console.log(`${pc.bold('Data:')} ${JSON.stringify(result.data, null, 2)}`);
}

export function printError(format: OutputFormat, error: unknown): void {
  const message = isError(error) ? error.message : 'Unknown error occurred.';
  const statusCode = getStatusCode(error);
  const errorData = getErrorData(error);
  const apiMessages = getApiMessages(errorData);
  const validationDetails = error instanceof ValidationError ? error.details : undefined;
  const hasValidationDetails = validationDetails !== undefined && validationDetails.length > 0;
  const uniqueValidationDetails = validationDetails ? [...new Set(validationDetails)] : undefined;
  const apiMessagesWithoutDetails = uniqueValidationDetails
    ? apiMessages.filter((messageItem) => !uniqueValidationDetails.includes(messageItem))
    : apiMessages;
  const payloadForDisplay =
    errorData !== undefined && apiMessages.length === 0 ? JSON.stringify(errorData, null, 2) : undefined;

  if (format === 'json') {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: {
            message,
            ...(statusCode !== undefined ? { statusCode } : {}),
            ...(apiMessagesWithoutDetails.length > 0 ? { apiMessages: apiMessagesWithoutDetails } : {}),
            ...(hasValidationDetails && uniqueValidationDetails ? { details: uniqueValidationDetails } : {}),
            ...(errorData !== undefined ? { data: errorData } : {}),
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  console.error(pc.red('Error'));
  console.error(message);
  if (statusCode !== undefined) {
    console.error(`${pc.bold('Status:')} ${statusCode}`);
  }
  if (apiMessagesWithoutDetails.length > 0) {
    for (const apiMessage of apiMessagesWithoutDetails) {
      console.error(`${pc.bold('API:')} ${apiMessage}`);
    }
  }
  if (hasValidationDetails && uniqueValidationDetails !== undefined) {
    for (const detail of uniqueValidationDetails) {
      console.error(`${pc.bold('Detail:')} ${detail}`);
    }
  }
  if (payloadForDisplay !== undefined) {
    console.error(`${pc.bold('Data:')} ${payloadForDisplay}`);
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
