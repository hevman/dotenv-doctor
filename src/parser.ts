import type { EnvDocument, EnvEntry } from "./types.js";

function unquote(value: string): { value: string; quoted: boolean } {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if ((quote === "\"" || quote === "'") && trimmed.endsWith(quote)) {
    return {
      value: trimmed.slice(1, -1),
      quoted: true
    };
  }

  return {
    value: trimmed,
    quoted: false
  };
}

export function parseEnv(source: string): EnvDocument {
  const entries: EnvEntry[] = [];
  const duplicates: EnvEntry[] = [];
  const seen = new Set<string>();

  source.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      return;
    }

    const normalized = line.startsWith("export ") ? line.slice(7).trim() : line;
    const equalsIndex = normalized.indexOf("=");

    if (equalsIndex === -1) {
      return;
    }

    const key = normalized.slice(0, equalsIndex).trim();

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      return;
    }

    const parsed = unquote(normalized.slice(equalsIndex + 1));
    const entry: EnvEntry = {
      key,
      value: parsed.value,
      line: index + 1,
      quoted: parsed.quoted
    };

    if (seen.has(key)) {
      duplicates.push(entry);
    }

    seen.add(key);
    entries.push(entry);
  });

  return { entries, duplicates };
}
