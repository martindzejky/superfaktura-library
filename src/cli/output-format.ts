import pc from 'picocolors';
import { isError } from 'lodash-es';
import type { Result } from '../types';
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

  if (format === 'json') {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: {
            message,
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
}
