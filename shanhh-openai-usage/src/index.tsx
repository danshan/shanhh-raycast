import { Action, ActionPanel, Detail, environment, getPreferenceValues } from "@raycast/api";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CodexUsage, fetchCodexUsage } from "./clients/codex-app-server-client";
import { buildDailyTokenUsageChart, buildResetCreditsDetails, formatDuration, formatNumber, formatPlanType, formatRemainingPercent, formatResetTime, formatWindowTitle, selectDashboardLimit } from "./usage";

type Preferences = {
  codexBinPath: string;
};

function UsageActions({ onRefresh }: { onRefresh: () => void }) {
  return (
    <ActionPanel>
      <Action title="Refresh" onAction={onRefresh} />
      <Action.OpenInBrowser title="Open Codex Usage Dashboard" url="https://chatgpt.com/codex/settings/usage" />
    </ActionPanel>
  );
}

function formatDays(value: number | null): string {
  return value === null ? "Unavailable" : `${formatNumber(value)} days`;
}

function limitLabel(title: string): string {
  return title.replace(/ Limit$/, "");
}

function UsageMetadata({ usage, refreshedAt }: { usage: CodexUsage; refreshedAt?: Date }) {
  const { rateLimits } = usage;
  const { summary } = usage.tokenUsage;
  const primaryLabel = rateLimits.primary ? limitLabel(formatWindowTitle(rateLimits.primary, "Primary")) : undefined;
  const secondaryLabel = rateLimits.secondary ? limitLabel(formatWindowTitle(rateLimits.secondary, "Secondary")) : undefined;

  return (
    <Detail.Metadata>
      <Detail.Metadata.Label title="Plan" text={formatPlanType(rateLimits.planType)} />
      {rateLimits.primary ? <Detail.Metadata.Label title={`${primaryLabel} Remaining`} text={formatRemainingPercent(rateLimits.primary.usedPercent).replace(" remaining", "")} /> : null}
      {rateLimits.primary && formatResetTime(rateLimits.primary.resetsAt) ? <Detail.Metadata.Label title={`${primaryLabel} Resets`} text={formatResetTime(rateLimits.primary.resetsAt)} /> : null}
      {rateLimits.secondary ? <Detail.Metadata.Label title={`${secondaryLabel} Remaining`} text={formatRemainingPercent(rateLimits.secondary.usedPercent).replace(" remaining", "")} /> : null}
      {rateLimits.secondary && formatResetTime(rateLimits.secondary.resetsAt) ? <Detail.Metadata.Label title={`${secondaryLabel} Resets`} text={formatResetTime(rateLimits.secondary.resetsAt)} /> : null}
      {rateLimits.credits?.unlimited ? <Detail.Metadata.Label title="Credits" text="Unlimited" /> : rateLimits.credits?.hasCredits && rateLimits.credits.balance ? <Detail.Metadata.Label title="Credits" text={rateLimits.credits.balance} /> : null}
      {rateLimits.resetCredits ? <Detail.Metadata.Label title="Reset Credits" text={formatNumber(rateLimits.resetCredits.availableCount)} /> : null}
      <Detail.Metadata.Separator />
      <Detail.Metadata.Label title="Lifetime Tokens" text={formatNumber(summary.lifetimeTokens)} />
      <Detail.Metadata.Label title="Peak Daily Tokens" text={formatNumber(summary.peakDailyTokens)} />
      <Detail.Metadata.Label title="Longest Running Turn" text={formatDuration(summary.longestRunningTurnSec)} />
      <Detail.Metadata.Label title="Current Streak" text={formatDays(summary.currentStreakDays)} />
      <Detail.Metadata.Label title="Longest Streak" text={formatDays(summary.longestStreakDays)} />
      {refreshedAt ? <Detail.Metadata.Label title="Last Refreshed" text={refreshedAt.toLocaleTimeString()} /> : null}
    </Detail.Metadata>
  );
}

export default function Command() {
  const { codexBinPath } = getPreferenceValues<Preferences>();
  const [usage, setUsage] = useState<CodexUsage>();
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshedAt, setRefreshedAt] = useState<Date>();
  const [now, setNow] = useState(Date.now);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      setUsage(await fetchCodexUsage(codexBinPath));
      setRefreshedAt(new Date());
      setNow(Date.now());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load Codex usage.");
    } finally {
      setIsLoading(false);
    }
  }, [codexBinPath]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const actions = <UsageActions onRefresh={() => void load()} />;
  const markdown = useMemo(() => {
    if (error) return `# Could Not Load Codex Usage\n\n${error}`;
    if (!usage) return "# Codex Usage\n\nLoading usage...";
    const chart = buildDailyTokenUsageChart(usage.tokenUsage.dailyUsageBuckets, environment.appearance === "dark", selectDashboardLimit(usage.rateLimits), now);
    const resetCredits = buildResetCreditsDetails(usage.rateLimits.resetCredits);
    return resetCredits ? `${chart}\n\n${resetCredits}` : chart;
  }, [error, usage, now]);

  return <Detail navigationTitle={usage?.rateLimits.limitName ?? "Codex Usage"} isLoading={isLoading} markdown={markdown} metadata={usage ? <UsageMetadata usage={usage} refreshedAt={refreshedAt} /> : undefined} actions={actions} />;
}
