import type { Command } from 'commander';

export function addCommandHelp(command: Command, options: { examples: string[]; dataShape?: string }): void {
  const sections: string[] = [''];

  if (options.dataShape !== undefined) {
    sections.push('JSON --data shape:');
    sections.push(`  ${options.dataShape}`);
    sections.push('');
  }

  sections.push('Examples:');
  for (const example of options.examples) {
    sections.push(`  ${example}`);
  }

  command.addHelpText('after', sections.join('\n'));
}
