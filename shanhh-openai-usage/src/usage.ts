import type { DailyUsageBucket, RateLimitResetCredit, RateLimits, RateLimitWindow } from "./clients/codex-app-server-client.ts";

const numberFormatter = new Intl.NumberFormat("en-US");
const compactNumberFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const DAY_MS = 86_400_000;
const WEEK_MINS = 10_080;
const PACE_TOLERANCE = 2;

function remainingPercent(usedPercent: number): number {
  return Math.min(100, Math.max(0, 100 - usedPercent));
}

function formatDecimal(value: number): string {
  return Number(value.toFixed(1)).toString();
}

export function selectDashboardLimit(rateLimits: Pick<RateLimits, "primary" | "secondary">): RateLimitWindow | null {
  return [rateLimits.primary, rateLimits.secondary].find((window) => window?.windowDurationMins === WEEK_MINS) ?? rateLimits.primary ?? rateLimits.secondary;
}

export function getWeeklyPacing(window: RateLimitWindow, now: number) {
  if (window.windowDurationMins !== WEEK_MINS || window.resetsAt === null) return null;
  const remainingMs = window.resetsAt * 1000 - now;
  if (!Number.isFinite(remainingMs) || remainingMs <= 0 || remainingMs > WEEK_MINS * 60_000) return null;

  const quotaRemaining = remainingPercent(window.usedPercent);
  const remainingDays = remainingMs / DAY_MS;
  const timeRemaining = (remainingDays / 7) * 100;
  const headroom = quotaRemaining - timeRemaining;
  const status = quotaRemaining === 0 ? "exhausted" : headroom > PACE_TOLERANCE ? "headroom" : headroom < -PACE_TOLERANCE ? "below-baseline" : "near-baseline";
  return { quotaRemaining, timeRemaining, remainingDays, headroom, status } as const;
}

function formatResetCountdown(remainingDays: number): string {
  if (remainingDays >= 1) {
    const days = formatDecimal(remainingDays);
    return `Resets in ${days} ${days === "1" ? "day" : "days"}`;
  }
  const hours = remainingDays * 24;
  if (hours < 1) return "Resets in less than 1 hour";
  const formattedHours = formatDecimal(hours);
  return `Resets in ${formattedHours} ${formattedHours === "1" ? "hour" : "hours"}`;
}

export function formatNumber(value: number | null): string {
  return value === null ? "Unavailable" : numberFormatter.format(value);
}

export function formatRemainingPercent(usedPercent: number): string {
  const remaining = remainingPercent(usedPercent);
  return `${Number.isInteger(remaining) ? remaining : remaining.toFixed(1)}% remaining`;
}

export function formatWindowTitle(window: RateLimitWindow, fallback: string): string {
  if (window.windowDurationMins === null) return fallback;
  if (window.windowDurationMins % 1_440 === 0) return `${window.windowDurationMins / 1_440}-Day Limit`;
  if (window.windowDurationMins % 60 === 0) return `${window.windowDurationMins / 60}-Hour Limit`;
  return `${window.windowDurationMins}-Minute Limit`;
}

export function formatResetTime(resetsAt: number | null): string | undefined {
  return resetsAt === null ? undefined : new Date(resetsAt * 1000).toLocaleString();
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "Unavailable";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds === 0 ? `${minutes}m` : `${minutes}m ${remainingSeconds}s`;
}

export function formatPlanType(planType: string | null): string {
  if (!planType) return "Unavailable";
  return planType.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatResetCredit(credit: RateLimitResetCredit): string {
  const expires = credit.expiresAt === null ? "Never" : new Date(credit.expiresAt * 1000).toLocaleString();
  return `- Expires: ${expires}`;
}

export function buildResetCreditsDetails(resetCredits: RateLimits["resetCredits"]): string {
  if (!resetCredits) return "";
  const heading = `## Rate Limit Reset Credits\n\n**${numberFormatter.format(resetCredits.availableCount)} available**`;
  if (resetCredits.credits === null) return `${heading}\n\nExpiration details are unavailable.`;
  if (resetCredits.credits.length === 0) return heading;
  return `${heading}\n\n${resetCredits.credits.map(formatResetCredit).join("\n")}`;
}

function latestThirtyDays(buckets: DailyUsageBucket[]): DailyUsageBucket[] {
  const tokensByDate = new Map(buckets.map((bucket) => [bucket.startDate, bucket.tokens]));
  const latestDate = [...tokensByDate.keys()].sort().at(-1);
  if (!latestDate) return [];

  const endTime = Date.parse(`${latestDate}T00:00:00Z`);
  return Array.from({ length: 30 }, (_, index) => {
    const startDate = new Date(endTime - (29 - index) * DAY_MS).toISOString().slice(0, 10);
    return { startDate, tokens: tokensByDate.get(startDate) ?? 0 };
  });
}

export function buildDailyTokenUsageChart(buckets: DailyUsageBucket[], isDark: boolean, limit?: RateLimitWindow | null, now = Date.now()): string {
  const days = latestThirtyDays(buckets);
  if (days.length === 0 && !limit) return "## Daily Token Usage\n\nNo token usage recorded.";

  const width = 800;
  const left = 72;
  const isWeekly = limit?.windowDurationMins === WEEK_MINS;
  const pacing = limit ? getWeeklyPacing(limit, now) : null;
  const top = limit ? (pacing ? 272 : isWeekly ? 184 : 152) : 72;
  const height = days.length === 0 ? top + 36 : top + 288;
  const chartWidth = 704;
  const chartHeight = 224;
  const slotWidth = chartWidth / days.length;
  const barWidth = Math.max(4, slotWidth - 5);
  const maxTokens = Math.max(...days.map((day) => day.tokens), 1);
  const totalTokens = days.reduce((total, day) => total + day.tokens, 0);
  const textColor = isDark ? "#E6E7E9" : "#24262A";
  const mutedColor = isDark ? "#8B8F97" : "#6B7078";
  const gridColor = isDark ? "#34373D" : "#E0E2E5";
  const barColor = isDark ? "#57A5FF" : "#2878D0";
  const peakColor = isDark ? "#7CD4C5" : "#168F7C";

  const progress = limit
    ? (() => {
        const remaining = remainingPercent(limit.usedPercent);
        const label = formatWindowTitle(limit, "Usage Limit");
        const reset = formatResetTime(limit.resetsAt);
        const percent = Number.isInteger(remaining) ? remaining : remaining.toFixed(1);
        const quota = `<text x="${left}" y="82" fill="${textColor}" font-size="14" font-weight="600">${label} Remaining</text><text x="${left + chartWidth}" y="82" text-anchor="end" fill="${textColor}" font-size="14" font-weight="600">${percent}%</text><rect x="${left}" y="94" width="${chartWidth}" height="14" rx="7" fill="${gridColor}"/><rect class="quota-remaining" x="${left}" y="94" width="${(chartWidth * remaining) / 100}" height="14" rx="7" fill="${barColor}"/>`;
        if (!pacing) {
          const resetDue = limit.resetsAt !== null && limit.resetsAt * 1000 <= now;
          const unavailable = isWeekly ? `<text x="${left}" y="134" fill="${mutedColor}" font-size="12">${resetDue ? "Reset due · Refresh required" : "Time comparison unavailable"}</text>` : "";
          return `${quota}${unavailable}${reset ? `<text x="${left}" y="${isWeekly ? 158 : 130}" fill="${mutedColor}" font-size="12">Resets ${reset}</text>` : ""}`;
        }

        const statusLabels = { exhausted: "Quota exhausted", headroom: "Headroom", "below-baseline": "Below baseline", "near-baseline": "Near baseline" };
        const statusColors = { exhausted: isDark ? "#F18487" : "#BE4144", headroom: peakColor, "below-baseline": isDark ? "#EFB764" : "#A3640E", "near-baseline": mutedColor };
        const delta = `${pacing.headroom > 0 ? "+" : ""}${formatDecimal(pacing.headroom)} pp`;
        const ticks = Array.from({ length: 8 }, (_, day) => {
          const x = left + (chartWidth * day) / 7;
          const anchor = day === 0 ? "start" : day === 7 ? "end" : "middle";
          return `<line x1="${x}" y1="162" x2="${x}" y2="166" stroke="${mutedColor}"/><text x="${x}" y="182" text-anchor="${anchor}" fill="${mutedColor}" font-size="11">${day}d</text>`;
        }).join("");
        return `${quota}<text x="${left}" y="136" fill="${mutedColor}" font-size="12">Time Remaining</text><text x="${left + chartWidth}" y="136" text-anchor="end" fill="${textColor}" font-size="12">${formatDecimal(pacing.timeRemaining)}%</text><rect x="${left}" y="148" width="${chartWidth}" height="5" rx="2.5" fill="${gridColor}"/><rect class="time-remaining" x="${left}" y="148" width="${(chartWidth * pacing.timeRemaining) / 100}" height="5" rx="2.5" fill="${mutedColor}"/>${ticks}<circle cx="${left + 3}" cy="207" r="3" fill="${statusColors[pacing.status]}"/><text x="${left + 15}" y="211" fill="${textColor}" font-size="12">${statusLabels[pacing.status]} · ${delta}</text><text x="${left + chartWidth}" y="211" text-anchor="end" fill="${mutedColor}" font-size="12">${formatResetCountdown(pacing.remainingDays)}</text><text x="${left}" y="234" fill="${mutedColor}" font-size="12">Resets ${reset}</text>`;
      })()
    : "";

  const grid = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const y = top + chartHeight - chartHeight * ratio;
    const value = maxTokens * ratio;
    return `<line x1="${left}" y1="${y}" x2="${left + chartWidth}" y2="${y}" stroke="${gridColor}" stroke-width="1"/><text x="${left - 12}" y="${y + 4}" text-anchor="end" fill="${mutedColor}" font-size="12">${compactNumberFormatter.format(value)}</text>`;
  }).join("");

  const bars = days
    .map((day, index) => {
      const barHeight = (day.tokens / maxTokens) * chartHeight;
      const x = left + index * slotWidth + (slotWidth - barWidth) / 2;
      const y = top + chartHeight - barHeight;
      const color = day.tokens === maxTokens ? peakColor : barColor;
      const label = index % 5 === 0 || index === days.length - 1 ? `<text x="${x + barWidth / 2}" y="${top + chartHeight + 24}" text-anchor="middle" fill="${mutedColor}" font-size="11">${day.startDate.slice(5).replace("-", "/")}</text>` : "";
      return `<rect class="usage-bar" x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="2" fill="${color}"><title>${day.startDate}: ${numberFormatter.format(day.tokens)} tokens</title></rect>${label}`;
    })
    .join("");

  const chart = days.length === 0 ? `<text x="${left}" y="${top}" fill="${mutedColor}" font-size="14">No token usage recorded.</text>` : `${grid}${bars}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="-apple-system, BlinkMacSystemFont, sans-serif"><title>Codex usage dashboard</title><text x="${left}" y="30" fill="${textColor}" font-size="22" font-weight="600">Daily Token Usage</text><text x="${left}" y="52" fill="${mutedColor}" font-size="13">Latest 30 days · ${numberFormatter.format(totalTokens)} tokens total</text>${progress}${chart}</svg>`;
  return `![Daily Token Usage](data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")})`;
}
