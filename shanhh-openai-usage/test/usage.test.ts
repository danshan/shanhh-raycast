import assert from "node:assert/strict";
import test from "node:test";
import { parseRateLimitsResponse, parseTokenUsageResponse } from "../src/clients/codex-app-server-client.ts";
import { buildDailyTokenUsageChart, buildResetCreditsDetails, formatRemainingPercent, formatWindowTitle, getWeeklyPacing, selectDashboardLimit } from "../src/usage.ts";

const NOW = Date.parse("2026-09-22T00:00:00Z");
const DAY_MS = 86_400_000;

function weeklyLimit(usedPercent: number, days: number) {
  return { usedPercent, windowDurationMins: 10_080, resetsAt: (NOW + days * DAY_MS) / 1000 };
}

function decodeChart(markdown: string): string {
  const encoded = markdown.match(/base64,([^)]*)/)?.[1];
  assert.ok(encoded);
  return Buffer.from(encoded, "base64").toString("utf8");
}

test("selects the weekly window regardless of primary or secondary position", () => {
  const short = { usedPercent: 15, windowDurationMins: 300, resetsAt: NOW / 1000 + 3_600 };
  const weekly = weeklyLimit(80, 1);
  assert.equal(selectDashboardLimit({ primary: short, secondary: weekly }), weekly);
  assert.equal(selectDashboardLimit({ primary: weekly, secondary: short }), weekly);
  assert.equal(selectDashboardLimit({ primary: short, secondary: null }), short);
  assert.equal(selectDashboardLimit({ primary: null, secondary: weekly }), weekly);
  assert.equal(selectDashboardLimit({ primary: null, secondary: null }), null);
});

test("compares remaining quota against exact remaining weekly time", () => {
  const pacing = getWeeklyPacing(weeklyLimit(80, 1), NOW);
  assert.ok(pacing);
  assert.equal(pacing.quotaRemaining, 20);
  assert.equal(pacing.remainingDays, 1);
  assert.ok(Math.abs(pacing.timeRemaining - 100 / 7) < 1e-10);
  assert.ok(Math.abs(pacing.headroom - (20 - 100 / 7)) < 1e-10);
  assert.equal(pacing.status, "headroom");
  assert.equal(getWeeklyPacing(weeklyLimit(80, 3), NOW)?.status, "below-baseline");
  assert.equal(getWeeklyPacing(weeklyLimit(50, 3.5), NOW)?.status, "near-baseline");
  assert.equal(getWeeklyPacing(weeklyLimit(100, 1), NOW)?.status, "exhausted");
  assert.equal(getWeeklyPacing(weeklyLimit(48, 3.5), NOW)?.status, "near-baseline");
  assert.equal(getWeeklyPacing(weeklyLimit(52, 3.5), NOW)?.status, "near-baseline");
  assert.equal(getWeeklyPacing(weeklyLimit(-5, 7), NOW)?.quotaRemaining, 100);
  assert.equal(getWeeklyPacing(weeklyLimit(105, 1), NOW)?.quotaRemaining, 0);
});

test("keeps fractional days continuous across midnight and local clock updates", () => {
  const limit = weeklyLimit(80, 1.25);
  assert.equal(getWeeklyPacing(limit, NOW)?.remainingDays, 1.25);
  assert.equal(getWeeklyPacing(limit, NOW + DAY_MS / 2)?.remainingDays, 0.75);
});

test("does not infer weekly pacing from missing, expired, or inconsistent windows", () => {
  assert.equal(getWeeklyPacing({ ...weeklyLimit(80, 1), resetsAt: null }, NOW), null);
  assert.equal(getWeeklyPacing({ ...weeklyLimit(80, 1), windowDurationMins: null }, NOW), null);
  assert.equal(getWeeklyPacing({ ...weeklyLimit(80, 1), windowDurationMins: 300 }, NOW), null);
  assert.equal(getWeeklyPacing(weeklyLimit(80, 0), NOW), null);
  assert.equal(getWeeklyPacing(weeklyLimit(80, -1), NOW), null);
  assert.equal(getWeeklyPacing(weeklyLimit(80, 8), NOW), null);
});

test("renders aligned quota and time bars with headroom in both themes", () => {
  for (const isDark of [false, true]) {
    const svg = decodeChart(buildDailyTokenUsageChart([{ startDate: "2026-09-21", tokens: 100 }], isDark, weeklyLimit(80, 1), NOW));
    assert.match(svg, /7-Day Limit Remaining/);
    assert.match(svg, /Time Remaining/);
    assert.match(svg, /14\.3%/);
    assert.match(svg, /Headroom · \+5\.7 pp/);
    assert.match(svg, /Resets in 1 day/);
    assert.match(svg, /class="quota-remaining" x="72"[^>]*width="140\.8"/);
    assert.match(svg, /class="time-remaining" x="72"/);
    assert.match(svg, /7d<\/text>/);
  }
});

test("renders the weekly comparison without daily token history", () => {
  const svg = decodeChart(buildDailyTokenUsageChart([], true, weeklyLimit(80, 0.5), NOW));
  assert.match(svg, /Time Remaining/);
  assert.match(svg, /Resets in 12 hours/);
  assert.match(svg, /No token usage recorded/);
  assert.doesNotMatch(svg, /class="usage-day"|0 tokens recorded/);
});

test("removes pacing advice when reset data is missing or due", () => {
  const expired = decodeChart(buildDailyTokenUsageChart([], true, weeklyLimit(80, 0), NOW));
  assert.match(expired, /Reset due · Refresh required/);
  assert.doesNotMatch(expired, /Headroom|class="time-remaining"/);
  const unknown = decodeChart(buildDailyTokenUsageChart([], false, { ...weeklyLimit(80, 1), resetsAt: null }, NOW));
  assert.match(unknown, /Time comparison unavailable/);
  assert.doesNotMatch(unknown, /Headroom|class="time-remaining"|Resets /);
});

test("parses Codex usage limits and token analytics", () => {
  const rateLimits = parseRateLimitsResponse({
    rateLimits: {
      limitName: "Codex",
      planType: "plus",
      primary: { usedPercent: 25.5, windowDurationMins: 300, resetsAt: 1_700_000_000 },
      secondary: null,
      credits: { hasCredits: true, unlimited: false, balance: "12.50" },
    },
    rateLimitResetCredits: {
      availableCount: 1,
      credits: [
        {
          id: "credit-placeholder",
          resetType: "codexRateLimits",
          status: "available",
          grantedAt: 1_700_000_000,
          expiresAt: 1_702_592_000,
          title: "Referral reward",
          description: "One rate limit reset",
        },
      ],
    },
  });
  const tokenUsage = parseTokenUsageResponse({
    summary: {
      lifetimeTokens: 1_234_567,
      peakDailyTokens: 45_678,
      longestRunningTurnSec: 125,
      currentStreakDays: 3,
      longestStreakDays: 7,
    },
    dailyUsageBuckets: [{ startDate: "2026-09-16", tokens: 12_345 }],
  });

  assert.equal(rateLimits.planType, "plus");
  assert.equal(rateLimits.credits?.balance, "12.50");
  assert.equal(rateLimits.resetCredits?.availableCount, 1);
  assert.equal(rateLimits.resetCredits?.credits?.[0].expiresAt, 1_702_592_000);
  assert.equal(tokenUsage.summary.lifetimeTokens, 1_234_567);
  assert.deepEqual(tokenUsage.dailyUsageBuckets, [{ startDate: "2026-09-16", tokens: 12_345 }]);
  assert.equal(formatRemainingPercent(25.5), "74.5% remaining");
  assert.equal(formatWindowTitle(rateLimits.primary!, "Primary Limit"), "5-Hour Limit");
});

test("formats only reset credit expiration details", () => {
  const markdown = buildResetCreditsDetails({
    availableCount: 1,
    credits: [
      {
        expiresAt: 1_702_592_000,
      },
    ],
  });

  assert.match(markdown, /Expires:/);
  assert.doesNotMatch(markdown, /Status:|Type:|Granted:/);
});

test("rejects unsafe token counts", () => {
  assert.throws(
    () =>
      parseTokenUsageResponse({
        summary: {
          lifetimeTokens: Number.MAX_SAFE_INTEGER + 1,
          peakDailyTokens: null,
          longestRunningTurnSec: null,
          currentStreakDays: null,
          longestStreakDays: null,
        },
        dailyUsageBuckets: null,
      }),
    /invalid summary\.lifetimeTokens/,
  );
});

test("renders a 365-day heatmap without treating missing records as zero", () => {
  const markdown = buildDailyTokenUsageChart(
    [
      { startDate: "2025-09-16", tokens: 10_000 },
      { startDate: "2026-09-13", tokens: 0 },
      { startDate: "2026-09-14", tokens: 100 },
      { startDate: "2026-09-16", tokens: 300 },
    ],
    true,
    { usedPercent: 25.5, windowDurationMins: 10_080, resetsAt: 1_700_000_000 },
  );
  const svg = decodeChart(markdown);
  assert.match(svg, /Daily Token Usage/);
  assert.match(svg, /7-Day Limit Remaining/);
  assert.match(svg, /74\.5%/);
  assert.match(svg, /Last 365 days · 400 tokens recorded/);
  assert.match(svg, /Data through 2026-09-16/);
  assert.match(svg, /3 \/ 365 days reported/);
  assert.match(svg, /2026-09-13: 0 tokens/);
  assert.match(svg, /2026-09-15: No record/);
  assert.match(svg, /2026-09-16: 300 tokens/);
  assert.match(svg, /data-date="2026-09-13" data-level="0"/);
  assert.match(svg, /data-date="2026-09-15" data-level="missing"[^>]*fill="none"[^>]*stroke-dasharray=/);
  assert.match(svg, /data-date="2026-09-16" data-level="10"/);
  assert.match(svg, /2025-09-17 to 2026-09-16/);
  assert.match(svg, /Daily peak: 300 tokens/);
  assert.doesNotMatch(svg, /2025-09-16|2026-09-15: 0 tokens|usage-bar/);
  assert.equal((svg.match(/class="usage-day"/g) ?? []).length, 365);
});

test("anchors the calendar to the latest API date across years and ignores input order", () => {
  const buckets = [
    { startDate: "2026-01-02", tokens: 20 },
    { startDate: "2025-01-02", tokens: 1_000 },
    { startDate: "2025-01-03", tokens: 10 },
  ];
  const svg = decodeChart(buildDailyTokenUsageChart(buckets, false, null, Date.parse("2026-02-01T00:00:00Z")));
  assert.match(svg, /2025-01-03 to 2026-01-02/);
  assert.match(svg, /Last 365 days · 30 tokens recorded/);
  assert.doesNotMatch(svg, /2025-01-02|2026-01-03|2026-02-01/);
  assert.equal(decodeChart(buildDailyTokenUsageChart([...buckets].reverse(), false)), svg);
});

test("keeps leap days and Sunday week boundaries aligned across DST in UTC", () => {
  const svg = decodeChart(buildDailyTokenUsageChart([{ startDate: "2024-03-11", tokens: 1 }], false));
  assert.match(svg, /2024-02-29: No record/);
  const position = (date: string) => {
    const match = svg.match(new RegExp(`data-date="${date}"[^>]* x="([\\d.]+)" y="([\\d.]+)"`));
    assert.ok(match);
    return { x: Number(match[1]), y: Number(match[2]) };
  };
  const saturday = position("2024-03-09");
  const sunday = position("2024-03-10");
  const monday = position("2024-03-11");
  assert.ok(sunday.x > saturday.x);
  assert.ok(sunday.y < saturday.y);
  assert.equal(monday.x, sunday.x);
  assert.ok(monday.y > sunday.y);
  assert.match(svg, /2023-03-13 to 2024-03-11/);
  assert.equal((svg.match(/class="usage-day"/g) ?? []).length, 365);
});

test("fits all 53 calendar weeks inside the SVG in both themes", () => {
  for (const isDark of [false, true]) {
    const svg = decodeChart(buildDailyTokenUsageChart([{ startDate: "2026-09-22", tokens: 1 }], isDark, weeklyLimit(80, 1), NOW));
    const bounds = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
    assert.ok(bounds);
    const cells = [...svg.matchAll(/class="usage-day"[^>]* x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)];
    assert.equal(cells.length, 365);
    assert.equal(new Set(cells.map((cell) => cell[1])).size, 53);
    assert.equal(new Set(cells.map((cell) => cell[2])).size, 7);
    for (const [, x, y, width, height] of cells) {
      assert.ok(Number(x) >= 0 && Number(x) + Number(width) <= Number(bounds[1]));
      assert.ok(Number(y) >= 0 && Number(y) + Number(height) <= Number(bounds[2]));
    }
  }
});

test("labels full months when the calendar begins near a month boundary", () => {
  const svg = decodeChart(buildDailyTokenUsageChart([{ startDate: "2026-09-22", tokens: 1 }], true));
  for (const month of ["Jul", "Aug", "Sep"]) assert.match(svg, new RegExp(`>${month}</text>`));
});

test("uses ten positive intensity levels relative to the displayed peak in both themes", () => {
  const tokens = [0, 1, 10, 11, 20, 21, 30, 31, 40, 41, 50, 51, 60, 61, 70, 71, 80, 81, 90, 91, 100];
  const levels = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10];
  const buckets = tokens.map((tokens, index) => ({ startDate: `2024-03-${String(index + 1).padStart(2, "0")}`, tokens }));
  for (const isDark of [false, true]) {
    const svg = decodeChart(buildDailyTokenUsageChart(buckets, isDark));
    for (let index = 0; index < levels.length; index++) {
      assert.match(svg, new RegExp(`data-date="${buckets[index].startDate}" data-level="${levels[index]}"`));
    }
    assert.match(svg, /No record/);
    assert.match(svg, />0 tokens<\/text>/);
    assert.match(svg, />Less<\/text>/);
    assert.match(svg, />More<\/text>/);
    const scaleColors = [...svg.matchAll(/class="usage-scale"[^>]*fill="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(scaleColors.length, 10);
    assert.equal(new Set(scaleColors).size, 10);
    assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
  }
});

test("renders explicit zero usage and absent history without inventing positive activity", () => {
  const svg = decodeChart(buildDailyTokenUsageChart([{ startDate: "2024-02-29", tokens: 0 }], true));
  assert.match(svg, /Last 365 days · 0 tokens recorded/);
  assert.match(svg, /Daily peak: 0 tokens/);
  assert.match(svg, /data-date="2024-02-29" data-level="0"/);
  assert.doesNotMatch(svg, /data-level="(?:[1-9]|10)"|NaN|Infinity/);
  assert.equal(buildDailyTokenUsageChart([], true), "## Daily Token Usage\n\nNo token usage recorded.");
});
