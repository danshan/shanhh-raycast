import type { DailyUsageBucket, RateLimitResetCredit, RateLimits, RateLimitWindow } from "./clients/codex-app-server-client.ts";

const numberFormatter = new Intl.NumberFormat("en-US");
const compactNumberFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const DAY_MS = 86_400_000;

export function formatNumber(value: number | null): string {
  return value === null ? "Unavailable" : numberFormatter.format(value);
}

export function formatRemainingPercent(usedPercent: number): string {
  const remaining = Math.max(0, 100 - usedPercent);
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

export function buildDailyTokenUsageChart(buckets: DailyUsageBucket[], isDark: boolean, limit?: RateLimitWindow | null): string {
  const days = latestThirtyDays(buckets);
  if (days.length === 0) return "## Daily Token Usage\n\nNo token usage recorded.";

  const width = 800;
  const height = limit ? 440 : 360;
  const left = 72;
  const top = limit ? 152 : 72;
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
        const remaining = Math.min(100, Math.max(0, 100 - limit.usedPercent));
        const label = formatWindowTitle(limit, "Usage Limit");
        const reset = formatResetTime(limit.resetsAt);
        const percent = Number.isInteger(remaining) ? remaining : remaining.toFixed(1);
        return `<defs><linearGradient id="limit-progress" x1="0" x2="1"><stop offset="0%" stop-color="#57A5FF"/><stop offset="100%" stop-color="#7CD4C5"/></linearGradient></defs><text x="${left}" y="82" fill="${textColor}" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="600">${label} Remaining</text><text x="${left + chartWidth}" y="82" text-anchor="end" fill="${textColor}" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="14" font-weight="600">${percent}%</text><rect x="${left}" y="94" width="${chartWidth}" height="14" rx="7" fill="${gridColor}"/><rect x="${left}" y="94" width="${(chartWidth * remaining) / 100}" height="14" rx="7" fill="url(#limit-progress)"/>${reset ? `<text x="${left}" y="130" fill="${mutedColor}" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="12">Resets ${reset}</text>` : ""}`;
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>Codex usage dashboard</title><text x="${left}" y="30" fill="${textColor}" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="600">Daily Token Usage</text><text x="${left}" y="52" fill="${mutedColor}" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="13">Latest 30 days · ${numberFormatter.format(totalTokens)} tokens total</text>${progress}<g font-family="-apple-system, BlinkMacSystemFont, sans-serif">${grid}${bars}</g></svg>`;
  return `![Daily Token Usage](data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")})`;
}
