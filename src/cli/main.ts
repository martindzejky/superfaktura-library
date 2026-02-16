import { Command } from 'commander';
import { DEFAULT_BASE_URL } from '../core/constants';
import { printError } from './output-format';
import { registerContactCommands } from './commands/register-contact-commands';
import { registerInvoiceCommands } from './commands/register-invoice-commands';
import type { GlobalCliOptions, OutputFormat } from './types';

declare const __PACKAGE_VERSION__: string;

function parseOutputFormat(value: string): OutputFormat {
  if (value === 'text' || value === 'json') {
    return value;
  }
  throw new Error('Invalid output format. Use text or json.');
}

export async function runCli(argv: string[] = process.argv): Promise<void> {
  const program = new Command();

  // prettier-ignore
  program
    .name('superfaktura')
    .version(__PACKAGE_VERSION__, '-v, --version')
    .description('Simple CLI for SuperFaktura contacts and invoices.')
    .option( '--output <format>', 'Output format: text or json', parseOutputFormat, 'text',)
    .option('--email <email>', 'API email')
    .option('--api-key <key>', 'API key')
    .option('--company-id <number>', 'Company ID', Number)
    .option('--base-url <url>', 'SuperFaktura API URL', DEFAULT_BASE_URL);

  program.showHelpAfterError();

  registerContactCommands(program);
  registerInvoiceCommands(program);

  try {
    await program.parseAsync(argv);
  } catch (error) {
    const output = program.opts<GlobalCliOptions>().output ?? 'text';
    printError(output, error);
    process.exit(1);
  }
}
