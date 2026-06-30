import test from "node:test";
import assert from "node:assert/strict";
import { createExample, doctor, parseEnv } from "../dist/index.js";

test("parses env entries and duplicates", () => {
  const parsed = parseEnv("A=1\nexport B='two'\nA=3\n# ignored");

  assert.equal(parsed.entries.length, 3);
  assert.equal(parsed.entries[1].value, "two");
  assert.deepEqual(parsed.duplicates.map((entry) => entry.key), ["A"]);
});

test("reports missing, empty and extra variables", () => {
  const report = doctor("A=1\nB=\nC=3", "A=\nB=\nD=");

  assert.equal(report.ok, false);
  assert.deepEqual(report.issues.map((issue) => issue.code), ["empty", "missing", "extra"]);
});

test("detects secrets inside example files", () => {
  const report = doctor("API_TOKEN=abc", "API_TOKEN=sk-real-looking-secret-value");

  assert.equal(report.ok, false);
  assert.equal(report.issues[0].code, "secret-in-example");
});

test("can generate a shareable example file", () => {
  const example = createExample("DATABASE_URL=postgres://local\nAPI_TOKEN=secret");

  assert.equal(example, "DATABASE_URL=\nAPI_TOKEN=changeme\n");
});

test("allow-extra suppresses extra warnings", () => {
  const report = doctor("A=1\nB=2", "A=", { allowExtra: true });

  assert.equal(report.issues.length, 0);
  assert.equal(report.ok, true);
});
