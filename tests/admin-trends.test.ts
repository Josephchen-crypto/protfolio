import assert from "node:assert/strict";
import test from "node:test";

const {
  formatDayUtc,
  formatMonthUtc,
  enumerateDays,
  enumerateMonths,
  densify,
  TREND_WINDOW,
} = await import(new URL("../lib/admin/trends.ts", import.meta.url).href);

test("formatDayUtc pads month and day to two digits, UTC", () => {
  assert.equal(formatDayUtc(new Date("2026-01-05T23:00:00Z")), "2026-01-05");
  assert.equal(formatDayUtc(new Date("2026-12-31T00:00:00Z")), "2026-12-31");
});

test("formatMonthUtc yields YYYY-MM in UTC", () => {
  assert.equal(formatMonthUtc(new Date("2026-01-05T00:00:00Z")), "2026-01-01".slice(0, 7));
  assert.equal(formatMonthUtc(new Date("2026-07-20T00:00:00Z")), "2026-07");
});

test("enumerateDays returns exactly N labels in ascending order, ending today", () => {
  const now = new Date("2026-07-20T12:00:00Z");
  const labels: string[] = enumerateDays(now, 5);
  assert.equal(labels.length, 5);
  assert.deepEqual(labels, [
    "2026-07-16",
    "2026-07-17",
    "2026-07-18",
    "2026-07-19",
    "2026-07-20",
  ]);
});

test("enumerateDays handles month boundary correctly", () => {
  const now = new Date("2026-03-02T00:00:00Z");
  const labels: string[] = enumerateDays(now, 4);
  assert.deepEqual(labels, ["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
});

test("enumerateMonths returns exactly N labels ending this month, ascending", () => {
  const now = new Date("2026-07-20T00:00:00Z");
  const labels: string[] = enumerateMonths(now, 4);
  assert.deepEqual(labels, ["2026-04", "2026-05", "2026-06", "2026-07"]);
});

test("enumerateMonths handles year rollover correctly", () => {
  const now = new Date("2026-02-15T00:00:00Z");
  const labels: string[] = enumerateMonths(now, 4);
  assert.deepEqual(labels, ["2025-11", "2025-12", "2026-01", "2026-02"]);
});

test("densify fills zero for missing labels, preserves label order", () => {
  const labels = ["2026-07-18", "2026-07-19", "2026-07-20"];
  const points: Array<{ label: string; count: number }> = densify(labels, {
    "2026-07-18": 3,
    "2026-07-20": 7,
  });
  assert.deepEqual(points, [
    { label: "2026-07-18", count: 3 },
    { label: "2026-07-19", count: 0 },
    { label: "2026-07-20", count: 7 },
  ]);
});

test("densify with empty counts returns all zeros", () => {
  const labels = ["a", "b"];
  const points: Array<{ label: string; count: number }> = densify(labels, {});
  assert.deepEqual(points, [
    { label: "a", count: 0 },
    { label: "b", count: 0 },
  ]);
});

test("TREND_WINDOW matches ROADMAP spec: 30 days, 12 months", () => {
  assert.equal(TREND_WINDOW.day, 30);
  assert.equal(TREND_WINDOW.month, 12);
});
