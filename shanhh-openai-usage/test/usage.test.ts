import assert from "node:assert/strict";
import test from "node:test";
import { parseRateLimitsResponse, parseTokenUsageResponse } from "../src/clients/codex-app-server-client.ts";
import { buildDailyTokenUsageChart, buildResetCreditsDetails, formatRemainingPercent, formatWindowTitle } from "../src/usage.ts";

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
