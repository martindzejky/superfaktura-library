import type { ListQuery } from '../types';

function encodeSearch(search: string): string {
  return Buffer.from(search, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, ',');
}

export function toNamedQueryPath(query: ListQuery = {}): string {
  const params: Record<string, string | number | undefined> = {
    listinfo: 1,
    page: query.page,
    per_page: query.perPage,
    search: query.search ? encodeSearch(query.search) : undefined,
  };

  const segments = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => {
      const encodedValue = encodeURIComponent(String(value));
      return `${key}%3A${encodedValue}`;
    });

  return segments.join('/');
}
