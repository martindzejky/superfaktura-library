#!/usr/bin/env node
import { runCli } from '../dist/cli.js';

runCli(process.argv).catch((error) => {
  const message =
    error instanceof Error ? error.message : 'Unknown error occurred.';
  console.error(message);
  process.exit(1);
});
