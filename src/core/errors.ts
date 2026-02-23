import type { UnknownRecord } from './types';

export class HttpError extends Error {
  readonly statusCode: number;
  readonly data: unknown;

  constructor(statusCode: number, data: unknown) {
    super(`HTTP ${statusCode} returned by SuperFaktura API.`);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export class ApiError extends Error {
  readonly statusCode: number;
  readonly data: UnknownRecord;

  constructor(statusCode: number, data: UnknownRecord) {
    super('SuperFaktura API returned an error response.');
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

export class ValidationError extends ApiError {
  readonly details: string[];

  constructor(statusCode: number, data: UnknownRecord, details: string[]) {
    super(statusCode, data);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class NotFoundError extends Error {
  constructor() {
    super('Requested resource was not found.');
    this.name = 'NotFoundError';
  }
}
