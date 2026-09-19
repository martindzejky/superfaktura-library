# superfaktura-library

Simple TypeScript SDK and CLI for [SuperFaktura](https://www.superfaktura.sk) contacts and invoices.

## Requirements

- Node.js `>=22.12`

## Install

```bash
npm install superfaktura-library
```

For local development in this repository:

```bash
pnpm install
pnpm run build
```

## Environment variables

The CLI automatically loads `.env` from the working directory. The SDK reads from `process.env` but does not load `.env` — use your own env loader or pass config directly.

Supported variables:

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
  apiEmail: process.env.SUPERFAKTURA_API_EMAIL,
  apiKey: process.env.SUPERFAKTURA_API_KEY,
});

// Create a contact
const { data, statusCode } = await client.contacts.create({
  name: 'ACME s.r.o.',
  email: 'billing@acme.test',
});

// Update a contact, returns void, throws on error
await client.contacts.update(contact.id, {
  email: 'new-billing@acme.test',
});

// Create an invoice
const { data, statusCode } = await client.invoices.create(
  {
    name: 'Invoice 2026-001',
    invoiceCurrency: 'EUR',
    items: [
      {
        name: 'Consulting',
        quantity: 1,
        unitPrice: 2.5,
        unitOfMeasure: 'h',
      },
    ],
  },
  { id: contact.id },
);

// Update an invoice, returns void, throws on error
await client.invoices.update(invoice.id, {
  name: 'Invoice 2026-001 (revised)',
});

// Pay, mark as sent (second arg sets desired state; omit to toggle)
await client.invoices.pay(invoice.id, {
  amount: 2.5,
  paymentType: 'transfer',
});
await client.invoices.markAsSent(invoice.id, true);

// Deleting
await client.invoices.remove(invoice.id);
await client.contacts.remove(contact.id);

// Download invoice PDF (slo = Slovak language)
// Token is optional; if omitted the SDK fetches the invoice first.
const pdf = await client.invoices.downloadPdf(invoice.id, 'slo', invoice.token);

// List and get return ListResult<T> and Result<T>
const { ... } = await client.contacts.list({ page: 1, perPage: 10 });
const { data, statusCode } = await client.contacts.getById(contact.id);
```

## CLI usage

After install:

```bash
npx superfaktura contacts list
```

Examples:

```bash
# Create contact with simple flags
npx superfaktura contacts create --name "ACME s.r.o." --email "billing@acme.test"

# Create contact from inline JSON
npx superfaktura contacts create \
  --data '{"name":"ACME s.r.o.","email":"billing@acme.test"}'

# Update contact with simple flags
npx superfaktura contacts update 123 --email "new-email@acme.test"

# Delete contact
npx superfaktura contacts delete 123

# Create invoice with simple flags (price + contact via ID)
npx superfaktura invoices create --price 120 --contact-id 123

# Create invoice with simple flags (price + contact name/email)
npx superfaktura invoices create \
  --price 120 \
  --contact-name "ACME s.r.o." \
  --contact-email "billing@acme.test"

# Update invoice name only
npx superfaktura invoices update 123 --name "New name"

# Update invoice with simple flags (sets items to one unit_price item)
npx superfaktura invoices update 123 --price 150

# Create invoice from file
npx superfaktura invoices create --data @./invoice-create.json

# Create contact from stdin
cat ./contact.json | npx superfaktura contacts create --data -

# Update invoice by ID from file
npx superfaktura invoices update 123 --data @./invoice-update.json

# Download invoice PDF
npx superfaktura invoices pdf 123 --path ./invoice-123.pdf

# Pay invoice with simple flags or JSON payload
npx superfaktura invoices pay 123 --amount 100 --payment-type transfer
npx superfaktura invoices pay 123 \
  --data '{"amount":100,"paymentType":"transfer"}'

# Set invoice sent state (final state matches --sent; API is toggle-only)
npx superfaktura invoices mark-sent 123 --sent true
npx superfaktura invoices mark-sent 123 --sent false

# Delete invoice
npx superfaktura invoices delete 123

# JSON output for automations/agents
npx superfaktura invoices get 123 --output json
```

Global options:

- `--api-email`
- `--api-key`
- `--company-id`
- `--base-url`
- `--output text|json` (default `text`)

## Releases

GitHub Actions publishes this package to npm. Do not run `npm publish` locally.

After the changes you want to ship are on `master`, with a clean working tree:

```bash
pnpm version patch
git push origin master --follow-tags
```

`pnpm version` also accepts `minor` and `major`.

`pnpm version` is the npm `version` command. It bumps `package.json`, commits, and creates an annotated git tag like `v1.0.4`. The `v` prefix is npm's default `tag-version-prefix`, and it matches every release tag already in this repo. The Publish workflow runs on `v*.*.*` tags. The number after `v` must match `package.json`. A mismatch fails the workflow on purpose.

A GitHub Release is optional. If you create one from a `v*.*.*` tag, that tag push still runs the same workflow.

### One-time npm setup

The workflow authenticates with npm trusted publishing. There is no `NPM_TOKEN` GitHub secret, and you should not add one.

On the [package settings](https://www.npmjs.com/package/superfaktura-library) page, add a GitHub Actions trusted publisher:

- Organization or user: `martindzejky`
- Repository: `superfaktura-library`
- Workflow filename: `publish.yml`
- Allowed actions: `npm publish`

Save that before you push the next tag. npm does not validate the form until publish time, so a typo only shows up as an auth error.

After the first CI publish succeeds, you can require 2FA and disallow tokens on the same settings page. Trusted publishing still works. Classic automation tokens stop working.
