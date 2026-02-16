import { ApiError, HttpError, NotFoundError, ValidationError } from '../errors';
import type { BinaryResult, Result, UnknownRecord } from '../types';
import { normalizeErrorMessages, toRecord } from '../utils';

interface HttpClientConfig {
  baseUrl: string;
  authHeader: string;
  timeoutMs: number;
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export class HttpClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly timeoutMs: number;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.authHeader = config.authHeader;
    this.timeoutMs = config.timeoutMs;
  }

  async request(method: HttpMethod, path: string, body?: UnknownRecord): Promise<Result<UnknownRecord>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const requestInit: RequestInit = {
        method,
        headers: {
          Authorization: this.authHeader,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        signal: controller.signal,
      };

      if (body) {
        requestInit.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${path}`, requestInit);

      const text = await response.text();
      const parsed: unknown = text.length > 0 ? JSON.parse(text) : {};
      const data = toRecord(parsed) ?? {};

      if (response.status === 404) {
        throw new NotFoundError();
      }

      if (!response.ok) {
        throw new HttpError(response.status, data);
      }

      const error = data.error;
      if (typeof error === 'number' && error > 0) {
        const details = normalizeErrorMessages(data.error_message);
        if (details.length > 0) {
          throw new ValidationError(response.status, data, details);
        }
        throw new ApiError(response.status, data);
      }

      return {
        statusCode: response.status,
        data,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async requestBinary(method: HttpMethod, path: string): Promise<BinaryResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: this.authHeader,
        },
        signal: controller.signal,
      });

      if (response.status === 404) {
        throw new NotFoundError();
      }

      if (!response.ok) {
        const text = await response.text();
        throw new HttpError(response.status, { message: text });
      }

      const buffer = new Uint8Array(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') ?? undefined;

      return {
        statusCode: response.status,
        data: buffer,
        ...(contentType ? { contentType } : {}),
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
