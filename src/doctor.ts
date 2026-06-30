import { parseEnv } from "./parser.js";
import type { DoctorOptions, DoctorReport, EnvDocument, EnvEntry, EnvIssue } from "./types.js";

const PLACEHOLDER_VALUES = new Set([
  "changeme",
  "change-me",
  "change_me",
  "todo",
  "example",
  "your-value",
  "your_value",
  "replace-me",
  "replace_me"
]);

const SECRET_KEY_PATTERN = /(secret|token|password|passwd|pwd|private|apikey|api_key|access_key|client_secret)/i;
const SECRET_VALUE_PATTERN = /^(sk-|pk_live_|ghp_|github_pat_|xox[baprs]-|eyJ)[A-Za-z0-9._-]{10,}/;

function byKey(document: EnvDocument): Map<string, EnvEntry> {
  const map = new Map<string, EnvEntry>();

  for (const entry of document.entries) {
    if (!map.has(entry.key)) {
      map.set(entry.key, entry);
    }
  }

  return map;
}

function isPlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "" || normalized.includes("<") || normalized.includes("...") || PLACEHOLDER_VALUES.has(normalized);
}

function looksLikeSecret(key: string, value: string): boolean {
  if (!SECRET_KEY_PATTERN.test(key)) {
    return false;
  }

  const trimmed = value.trim();
  return trimmed.length >= 12 && !isPlaceholder(trimmed) && (SECRET_VALUE_PATTERN.test(trimmed) || /[A-Za-z]/.test(trimmed));
}

function duplicateIssues(scope: "env" | "example", duplicates: EnvEntry[]): EnvIssue[] {
  return duplicates.map((entry) => ({
    code: "duplicate",
    level: "error",
    key: entry.key,
    line: entry.line,
    message: `${entry.key} is duplicated in ${scope}`
  }));
}

export function doctor(envSource: string, exampleSource: string, options: DoctorOptions = {}): DoctorReport {
  const env = parseEnv(envSource);
  const example = parseEnv(exampleSource);
  const envMap = byKey(env);
  const exampleMap = byKey(example);
  const issues: EnvIssue[] = [
    ...duplicateIssues("env", env.duplicates),
    ...duplicateIssues("example", example.duplicates)
  ];

  for (const entry of example.entries) {
    const envEntry = envMap.get(entry.key);

    if (!envEntry) {
      issues.push({
        code: "missing",
        level: "error",
        key: entry.key,
        line: entry.line,
        message: `${entry.key} exists in .env.example but is missing in .env`
      });
      continue;
    }

    if (options.requireFilled !== false && envEntry.value.trim() === "") {
      issues.push({
        code: "empty",
        level: "error",
        key: entry.key,
        line: envEntry.line,
        message: `${entry.key} is present in .env but has an empty value`
      });
    }

    if (envEntry.value.trim() !== "" && isPlaceholder(envEntry.value)) {
      issues.push({
        code: "placeholder-in-env",
        level: "warning",
        key: entry.key,
        line: envEntry.line,
        message: `${entry.key} in .env looks like a placeholder`
      });
    }
  }

  if (!options.allowExtra) {
    for (const entry of env.entries) {
      if (!exampleMap.has(entry.key)) {
        issues.push({
          code: "extra",
          level: "warning",
          key: entry.key,
          line: entry.line,
          message: `${entry.key} exists in .env but is not documented in .env.example`
        });
      }
    }
  }

  if (options.checkExampleSecrets !== false) {
    for (const entry of example.entries) {
      if (looksLikeSecret(entry.key, entry.value)) {
        issues.push({
          code: "secret-in-example",
          level: "error",
          key: entry.key,
          line: entry.line,
          message: `${entry.key} in .env.example looks like a real secret`
        });
      }
    }
  }

  return {
    ok: !issues.some((issue) => issue.level === "error"),
    issues,
    env: {
      keys: [...envMap.keys()],
      duplicates: env.duplicates.map((entry) => entry.key)
    },
    example: {
      keys: [...exampleMap.keys()],
      duplicates: example.duplicates.map((entry) => entry.key)
    }
  };
}

export function createExample(envSource: string): string {
  const env = parseEnv(envSource);

  return env.entries
    .map((entry) => {
      const placeholder = SECRET_KEY_PATTERN.test(entry.key) ? "changeme" : "";
      return `${entry.key}=${placeholder}`;
    })
    .join("\n")
    .concat(env.entries.length > 0 ? "\n" : "");
}
