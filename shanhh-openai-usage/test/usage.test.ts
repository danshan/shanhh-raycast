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
  assert.doesNotMatch(svg, /class="usage-bar"/);
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

test("builds a local 30-day token usage chart and fills missing dates", () => {
  const markdown = buildDailyTokenUsageChart(
    [
      { startDate: "2026-09-14", tokens: 100 },
      { startDate: "2026-09-16", tokens: 300 },
    ],
    true,
    { usedPercent: 25.5, windowDurationMins: 10_080, resetsAt: 1_700_000_000 },
  );
  const encodedSvg = markdown.match(/base64,([^)]*)/)?.[1];
  assert.ok(encodedSvg);

  const svg = Buffer.from(encodedSvg, "base64").toString("utf8");
  assert.match(svg, /Daily Token Usage/);
  assert.match(svg, /7-Day Limit Remaining/);
  assert.match(svg, /74\.5%/);
  assert.match(svg, /2026-09-15: 0 tokens/);
  assert.match(svg, /2026-09-16: 300 tokens/);
  assert.equal((svg.match(/class="usage-bar"/g) ?? []).length, 30);
});
