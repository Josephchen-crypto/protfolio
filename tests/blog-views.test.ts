import assert from "node:assert/strict";
import test from "node:test";

const {
  BLOG_VIEW_DEDUPE_WINDOW_MS,
  buildPostKey,
  getViewStorageKey,
  isValidViewPayload,
  normalizeViewRows,
  parseViewKeysParam,
  shouldCountView,
} = await import(new URL("../lib/blog-views.ts", import.meta.url).href);

test("buildPostKey combines language and slug", () => {
  assert.equal(buildPostKey("en", "home-module-factory"), "en:home-module-factory");
  assert.equal(buildPostKey("zh", "home-module-factory-zh"), "zh:home-module-factory-zh");
});

test("parseViewKeysParam splits and trims the key list", () => {
  assert.deepEqual(parseViewKeysParam("en:foo, zh:bar ,,en:baz"), [
    "en:foo",
    "zh:bar",
    "en:baz",
  ]);
  assert.deepEqual(parseViewKeysParam(null), []);
});

test("normalizeViewRows fills missing keys with zero", () => {
  const result = normalizeViewRows(
    ["en:foo", "zh:bar"],
    [{ post_key: "en:foo", views: 12 }]
  );

  assert.deepEqual(result, {
    "en:foo": 12,
    "zh:bar": 0,
  });
});

test("shouldCountView only allows another count after the dedupe window", () => {
  const now = 1_700_000_000_000;

  assert.equal(shouldCountView(undefined, now), true);
  assert.equal(shouldCountView(now - BLOG_VIEW_DEDUPE_WINDOW_MS + 1, now), false);
  assert.equal(shouldCountView(now - BLOG_VIEW_DEDUPE_WINDOW_MS, now), true);
});

test("getViewStorageKey namespaces the post key", () => {
  assert.equal(
    getViewStorageKey("en:home-module-factory"),
    "blog:view-counted:en:home-module-factory"
  );
});

test("isValidViewPayload accepts only supported languages and non-empty slugs", () => {
  assert.equal(isValidViewPayload({ lang: "en", slug: "hello-world" }), true);
  assert.equal(isValidViewPayload({ lang: "zh", slug: "hello-world-zh" }), true);
  assert.equal(isValidViewPayload({ lang: "jp", slug: "hello-world" }), false);
  assert.equal(isValidViewPayload({ lang: "en", slug: "" }), false);
  assert.equal(isValidViewPayload(null), false);
});
