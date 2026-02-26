import { ApiError, HttpError, NotFoundError, ValidationError } from './errors';
import type { BinaryResult, Result, UnknownRecord } from './types';
import { normalizeErrorMessages, toRecord } from './utils';

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
    this.baseUrl = config.baseUrl.replace(/\/+$/, ''); // remove trailing slashes
    this.authHeader = config.authHeader;
    this.timeoutMs = config.timeoutMs;
  }

  async request(method: HttpMethod, path: string, body?: UnknownRecord): Promise<Result<UnknownRecord>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = {
        Authorization: this.authHeader,
      };
      if (body) {
        headers['Content-Type'] = 'application/json';
      }

      const requestInit: RequestInit = {
        method,
        headers,
        signal: controller.signal,
      };

      if (body) {
        requestInit.body = JSON.stringify(body);
      }

      const url = `${this.baseUrl}${path}`;
      const response = await this.fetchWithTimeout(url, requestInit);

      const text = await response.text();
      const data = this.parseJsonBody(text, response.status);

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
      const url = `${this.baseUrl}${path}`;
      const response = await this.fetchWithTimeout(url, {
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

      const binaryResult: BinaryResult = {
        statusCode: response.status,
        data: buffer,
      };
      if (contentType) {
        binaryResult.contentType = contentType;
      }
      return binaryResult;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Request to ${url} timed out after ${this.timeoutMs}ms.`);
      }
      throw error;
    }
  }

  private parseJsonBody(text: string, statusCode: number): UnknownRecord {
    if (text.length === 0) {
      return {};
    }
    try {
      const parsed: unknown = JSON.parse(text);
      return toRecord(parsed) ?? {};
    } catch {
      throw new HttpError(statusCode, {
        message: `Expected JSON response but got: ${text.slice(0, 200)}`,
      });
    }
  }
}
