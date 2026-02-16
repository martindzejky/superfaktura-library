#!/usr/bin/env node
import { config as loadDotEnv } from 'dotenv';
import { runCli } from '../dist/cli.js';

loadDotEnv({ quiet: true });

runCli(process.argv).catch((error) => {
  const message = error instanceof Error ? error.message : 'Unknown error occurred.';
  console.error(message);
  process.exit(1);
});
