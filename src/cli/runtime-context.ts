import type { Command } from 'commander';
import { createClient } from '../client/create-client';
import type { RuntimeContext, GlobalCliOptions } from './types';
import type { ClientConfig } from '../core/types';

export function resolveRuntimeContext(command: Command): RuntimeContext {
  const options = command.optsWithGlobals<GlobalCliOptions>();
  const output = options.output ?? 'text';

  const clientOptions: ClientConfig = {};

  if (options.apiEmail) {
    clientOptions.apiEmail = options.apiEmail;
  }
  if (options.apiKey) {
    clientOptions.apiKey = options.apiKey;
  }
  if (options.companyId !== undefined) {
    clientOptions.companyId = options.companyId;
  }
  if (options.baseUrl) {
    clientOptions.baseUrl = options.baseUrl;
  }

  const client = createClient(clientOptions);

  return { output, client };
}
