import { spawn } from "node:child_process";
import { isAbsolute } from "node:path";

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_STDOUT_BYTES = 1_000_000;
const INITIALIZE_REQUEST_ID = 1;
const RATE_LIMITS_REQUEST_ID = 2;
const TOKEN_USAGE_REQUEST_ID = 3;

type JsonRecord = Record<string, unknown>;

export type RateLimitWindow = {
  usedPercent: number;
  windowDurationMins: number | null;
  resetsAt: number | null;
};

export type RateLimitResetCredit = {
  expiresAt: number | null;
};

export type RateLimits = {
  limitName: string | null;
  planType: string | null;
  primary: RateLimitWindow | null;
  secondary: RateLimitWindow | null;
  credits: { hasCredits: boolean; unlimited: boolean; balance: string | null } | null;
  resetCredits: { availableCount: number; credits: RateLimitResetCredit[] | null } | null;
};

export type DailyUsageBucket = { startDate: string; tokens: number };

export type TokenUsage = {
  summary: {
    lifetimeTokens: number | null;
    peakDailyTokens: number | null;
    longestRunningTurnSec: number | null;
    currentStreakDays: number | null;
    longestStreakDays: number | null;
  };
  dailyUsageBuckets: DailyUsageBucket[];
};

export type CodexUsage = {
  rateLimits: RateLimits;
  tokenUsage: TokenUsage;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, field: string): JsonRecord {
  if (!isRecord(value)) throw new Error(`Codex App Server returned an invalid ${field}.`);
  return value;
}

function requireNullableString(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`Codex App Server returned an invalid ${field}.`);
  return value;
}

function requireBoolean(value: unknown, field: string): boolean {
  if (typeof value !== "boolean") throw new Error(`Codex App Server returned an invalid ${field}.`);
  return value;
}

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Codex App Server returned an invalid ${field}.`);
  }
  return value;
}

function requireNullableInteger(value: unknown, field: string): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Codex App Server returned an invalid ${field}.`);
  }
  return value;
}

function parseWindow(value: unknown, field: string): RateLimitWindow | null {
  if (value === null) return null;
  const window = requireRecord(value, field);
  return {
    usedPercent: requireNumber(window.usedPercent, `${field}.usedPercent`),
    windowDurationMins: requireNullableInteger(window.windowDurationMins, `${field}.windowDurationMins`),
    resetsAt: requireNullableInteger(window.resetsAt, `${field}.resetsAt`),
  };
}

export function parseRateLimitsResponse(payload: unknown): RateLimits {
  const response = requireRecord(payload, "rate limits response");
  const rateLimits = requireRecord(response.rateLimits, "rate limits");
  const credits = rateLimits.credits === null ? null : requireRecord(rateLimits.credits, "credits");
  const resetCredits = response.rateLimitResetCredits === null ? null : requireRecord(response.rateLimitResetCredits, "rate limit reset credits");
  const resetCreditsAvailableCount = resetCredits ? requireNullableInteger(resetCredits.availableCount, "rateLimitResetCredits.availableCount") : null;
  if (resetCredits && resetCreditsAvailableCount === null) {
    throw new Error("Codex App Server returned invalid rate limit reset credits.");
  }
  let resetCreditRows: unknown[] | null = null;
  if (resetCredits && resetCredits.credits !== null) {
    if (!Array.isArray(resetCredits.credits)) {
      throw new Error("Codex App Server returned invalid rate limit reset credits.");
    }
    resetCreditRows = resetCredits.credits;
  }

  return {
    limitName: requireNullableString(rateLimits.limitName, "limitName"),
    planType: requireNullableString(rateLimits.planType, "planType"),
    primary: parseWindow(rateLimits.primary, "primary window"),
    secondary: parseWindow(rateLimits.secondary, "secondary window"),
    credits: credits
      ? {
          hasCredits: requireBoolean(credits.hasCredits, "credits.hasCredits"),
          unlimited: requireBoolean(credits.unlimited, "credits.unlimited"),
          balance: requireNullableString(credits.balance, "credits.balance"),
        }
      : null,
    resetCredits: resetCredits
      ? {
          availableCount: resetCreditsAvailableCount!,
          credits:
            resetCreditRows === null
              ? null
              : resetCreditRows.map((value, index) => {
                  const credit = requireRecord(value, `rate limit reset credit ${index}`);
                  return {
                    expiresAt: requireNullableInteger(credit.expiresAt, `rateLimitResetCredits.credits[${index}].expiresAt`),
                  };
                }),
        }
      : null,
  };
}

export function parseTokenUsageResponse(payload: unknown): TokenUsage {
  const response = requireRecord(payload, "token usage response");
  const summary = requireRecord(response.summary, "token usage summary");
  if (response.dailyUsageBuckets !== null && !Array.isArray(response.dailyUsageBuckets)) {
    throw new Error("Codex App Server returned invalid daily token usage.");
  }

  return {
    summary: {
      lifetimeTokens: requireNullableInteger(summary.lifetimeTokens, "summary.lifetimeTokens"),
      peakDailyTokens: requireNullableInteger(summary.peakDailyTokens, "summary.peakDailyTokens"),
      longestRunningTurnSec: requireNullableInteger(summary.longestRunningTurnSec, "summary.longestRunningTurnSec"),
      currentStreakDays: requireNullableInteger(summary.currentStreakDays, "summary.currentStreakDays"),
      longestStreakDays: requireNullableInteger(summary.longestStreakDays, "summary.longestStreakDays"),
    },
    dailyUsageBuckets: (response.dailyUsageBuckets ?? []).map((value, index) => {
      const bucket = requireRecord(value, `daily token usage bucket ${index}`);
      if (typeof bucket.startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(bucket.startDate) || !Number.isFinite(Date.parse(`${bucket.startDate}T00:00:00Z`))) {
        throw new Error("Codex App Server returned an invalid daily token usage date.");
      }
      const tokens = requireNullableInteger(bucket.tokens, `dailyUsageBuckets[${index}].tokens`);
      if (tokens === null) throw new Error("Codex App Server returned invalid daily token usage.");
      return { startDate: bucket.startDate, tokens };
    }),
  };
}

export async function fetchCodexUsage(codexBinPath: string): Promise<CodexUsage> {
  const executable = codexBinPath.trim();
  if (!isAbsolute(executable)) throw new Error("Codex Bin Path must be an absolute path.");

  return await new Promise((resolve, reject) => {
    const child = spawn(executable, ["app-server", "--stdio"], { stdio: ["pipe", "pipe", "pipe"] });
    let buffer = "";
    let rateLimits: RateLimits | undefined;
    let tokenUsage: TokenUsage | undefined;
    let settled = false;

    const timer = setTimeout(() => fail("Timed out while loading Codex usage."), REQUEST_TIMEOUT_MS);

    function finish(value?: CodexUsage, error?: Error) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdin.end();
      child.kill();
      if (error) reject(error);
      else if (value) resolve(value);
    }

    function fail(message: string) {
      finish(undefined, new Error(message));
    }

    function send(message: JsonRecord) {
      child.stdin.write(`${JSON.stringify(message)}\n`);
    }

    function handleMessage(value: unknown) {
      const message = requireRecord(value, "protocol message");
      if (message.id === INITIALIZE_REQUEST_ID) {
        if (message.error !== undefined) return fail("Codex App Server initialization failed.");
        send({ method: "initialized" });
        send({ method: "account/rateLimits/read", id: RATE_LIMITS_REQUEST_ID });
        send({ method: "account/usage/read", id: TOKEN_USAGE_REQUEST_ID, params: {} });
        return;
      }
      if (message.id === RATE_LIMITS_REQUEST_ID) {
        if (message.error !== undefined) return fail("Could not load Codex usage limits.");
        rateLimits = parseRateLimitsResponse(message.result);
      } else if (message.id === TOKEN_USAGE_REQUEST_ID) {
        if (message.error !== undefined) return fail("Could not load Codex token usage.");
        tokenUsage = parseTokenUsageResponse(message.result);
      } else {
        return;
      }
      if (rateLimits && tokenUsage) finish({ rateLimits, tokenUsage });
    }

    child.on("error", () => fail("Could not start Codex. Check Codex Bin Path in Preferences."));
    child.on("exit", () => {
      if (!settled) fail("Codex App Server exited before returning usage.");
    });
    child.stdin.on("error", () => fail("Could not communicate with Codex App Server."));
    child.stderr.resume();
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      buffer += chunk;
      if (Buffer.byteLength(buffer) > MAX_STDOUT_BYTES) return fail("Codex App Server returned too much data.");

      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) {
          try {
            handleMessage(JSON.parse(line));
          } catch {
            fail("Codex App Server returned invalid data.");
            return;
          }
        }
        newline = buffer.indexOf("\n");
      }
    });

    send({
      method: "initialize",
      id: INITIALIZE_REQUEST_ID,
      params: {
        clientInfo: { name: "shanhh-openai-usage", title: "Shanhh Codex Usage", version: "1.0.0" },
        capabilities: { experimentalApi: false, requestAttestation: false },
      },
    });
  });
}
