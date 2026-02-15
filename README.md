# superfaktura-library

Simple TypeScript SDK and CLI for [SuperFaktura](https://www.superfaktura.sk) contacts and invoices.

## Requirements

- Node.js `>=22`

## Install

```bash
npm install superfaktura-library
```

For local development in this repository:

```bash
npm install
npm run build
```

## Environment variables

The SDK and CLI both support these variables:

- `SUPERFAKTURA_API_URL` (default: `https://sandbox.superfaktura.sk`)
- `SUPERFAKTURA_API_EMAIL`
- `SUPERFAKTURA_API_COMPANY_ID`
- `SUPERFAKTURA_API_KEY`

Copy `.env.example` to `.env` and fill values.

## SDK usage

```ts
import { createClient } from 'superfaktura-library';

const client = createClient({
  // optional when present in env
  email: process.env.SUPERFAKTURA_API_EMAIL,
  apiKey: process.env.SUPERFAKTURA_API_KEY,
});

const created = await client.contacts.create({
  name: 'ACME s.r.o.',
  email: 'billing@acme.test',
});

const invoice = await client.invoices.create({
  contact: { name: 'ACME s.r.o.' },
  items: [{ name: 'Consulting', quantity: 1, unit_price: 100, tax: 20 }],
});

const pdf = await client.invoices.downloadPdf(123, 'sk');
```

## CLI usage

After install:

```bash
npx superfaktura contacts list
```

Examples:

```bash
# Create contact from inline JSON
npx superfaktura contacts create \
  --data '{"name":"ACME s.r.o.","email":"billing@acme.test"}'

# Create invoice from file
npx superfaktura invoices create --data @./invoice-create.json

# Download invoice PDF
npx superfaktura invoices pdf 123 --path ./invoice-123.pdf

# JSON output for automations/agents
npx superfaktura invoices get 123 --output json
```

Global options:

- `--email`
- `--api-key`
- `--company-id`
- `--base-url`
- `--output text|json` (default `text`)
