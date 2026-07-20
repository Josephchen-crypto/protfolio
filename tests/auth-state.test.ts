import assert from "node:assert/strict";
import test from "node:test";

const { generateState, parseState, validateState } = await import(
  new URL("../lib/auth/state.ts", import.meta.url).href
);

test("generateState produces correctly formatted string with lang", () => {
  const stateEn = generateState("en");
  const partsEn = stateEn.split(":");
  assert.equal(partsEn.length, 2);
  assert.equal(partsEn[1], "en");
  assert.equal(partsEn[0].length, 32); // 16 bytes → 32 hex chars

  const stateZh = generateState("zh");
  const partsZh = stateZh.split(":");
  assert.equal(partsZh.length, 2);
  assert.equal(partsZh[1], "zh");
  assert.equal(partsZh[0].length, 32);
});

test("parseState correctly parses valid state", () => {
  const state = generateState("en");
  const parsed = parseState(state);
  assert.ok(parsed !== null);
  assert.equal(parsed?.lang, "en");
  assert.equal(parsed?.random.length, 32);
});

test("parseState rejects invalid format", () => {
  assert.equal(parseState(""), null);
  assert.equal(parseState("notenoughparts"), null);
  assert.equal(parseState("randomstring"), null);
  assert.equal(parseState("not32chars:en"), null);
  assert.equal(parseState("abcdefghijklmnopqrstuvwxyzabcdef:xx"), null); // wrong lang
});

test("validateState accepts matching values", () => {
  const cookie = "random:en";
  const query = "random:en";
  assert.equal(validateState(cookie, query), true);
});

test("validateState rejects mismatched values", () => {
  assert.equal(validateState(undefined, "random:en"), false);
  assert.equal(validateState("cookie:en", "different:en"), false);
});
