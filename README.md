# dotenv-doctor

Check `.env` files against `.env.example` before a missing variable breaks deployment or a real secret slips into a public template.

## Why

Most apps have environment files, and most teams eventually lose time to one of these:

- `.env.example` is outdated.
- A required key is missing locally or in CI.
- A value is empty but should be filled.
- A real token was copied into `.env.example`.
- A new key exists in `.env` but is not documented.

`dotenv-doctor` catches those problems with a tiny zero-dependency CLI.

## Install

```bash
npm install -D @hevman/dotenv-doctor
```

Or run without installing:

```bash
npx @hevman/dotenv-doctor check --env .env --example .env.example
```

## CLI

```bash
dotenv-doctor check --env .env --example .env.example
```

Useful in CI:

```bash
dotenv-doctor check --json
```

Generate a safe `.env.example` from an existing `.env`:

```bash
dotenv-doctor example --env .env --out .env.example
```

Options:

```text
--json             Print machine-readable JSON
--allow-extra      Do not warn about keys missing from .env.example
--allow-empty      Do not fail on empty values in .env
--no-secret-scan   Skip real-secret detection in .env.example
```

## Example

`.env.example`

```env
DATABASE_URL=
API_TOKEN=changeme
PUBLIC_URL=http://localhost:3000
```

`.env`

```env
DATABASE_URL=postgres://user:pass@localhost:5432/app
API_TOKEN=sk-live-demo-value-that-should-not-be-shared
PUBLIC_URL=http://localhost:3000
UNTRACKED_FLAG=true
```

Run:

```bash
dotenv-doctor check --env examples/.env --example examples/.env.example
```

## Library

```ts
import { doctor, createExample } from "@hevman/dotenv-doctor";

const report = doctor(
  "DATABASE_URL=postgres://localhost/app",
  "DATABASE_URL="
);

console.log(report.ok);
console.log(createExample("API_TOKEN=real-token"));
```

## Publishing

```bash
npm test
npm pack --dry-run
npm publish --access public
```

## License

MIT
