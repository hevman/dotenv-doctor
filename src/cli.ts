#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { createExample, doctor } from "./index.js";
import type { DoctorReport, EnvIssue } from "./types.js";

function option(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function has(args: string[], name: string): boolean {
  return args.includes(name);
}

function printHelp(): void {
  console.log(`dotenv-doctor

Usage:
  dotenv-doctor check --env .env --example .env.example
  dotenv-doctor example --env .env --out .env.example

Options:
  --json             Print machine-readable JSON
  --allow-extra      Do not warn about keys missing from .env.example
  --allow-empty      Do not fail on empty values in .env
  --no-secret-scan   Skip real-secret detection in .env.example`);
}

function icon(issue: EnvIssue): string {
  return issue.level === "error" ? "x" : "!";
}

function printReport(report: DoctorReport): void {
  if (report.issues.length === 0) {
    console.log("OK .env matches .env.example");
    return;
  }

  for (const issue of report.issues) {
    const location = issue.line ? ` line ${issue.line}` : "";
    console.log(`${icon(issue)} ${issue.level.toUpperCase()} ${issue.code} ${issue.key}${location}`);
    console.log(`  ${issue.message}`);
  }

  const errors = report.issues.filter((issue) => issue.level === "error").length;
  const warnings = report.issues.length - errors;
  console.log(`\n${errors} error(s), ${warnings} warning(s)`);
}

async function read(path: string | undefined, fallback: string): Promise<string> {
  return readFile(path ?? fallback, "utf8");
}

async function run(): Promise<void> {
  const [, , command, ...args] = process.argv;

  if (!command || command === "-h" || command === "--help") {
    printHelp();
    return;
  }

  if (command === "check") {
    const report = doctor(
      await read(option(args, "--env"), ".env"),
      await read(option(args, "--example"), ".env.example"),
      {
        allowExtra: has(args, "--allow-extra"),
        requireFilled: !has(args, "--allow-empty"),
        checkExampleSecrets: !has(args, "--no-secret-scan")
      }
    );

    if (has(args, "--json")) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      printReport(report);
    }

    process.exitCode = report.ok ? 0 : 1;
    return;
  }

  if (command === "example") {
    const output = createExample(await read(option(args, "--env"), ".env"));
    const outPath = option(args, "--out");

    if (outPath) {
      await writeFile(outPath, output);
    } else {
      process.stdout.write(output);
    }
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
