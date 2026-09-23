import { BtsowDetailData, BtsowSearchResult } from "../types/btsow-search";
import { Action, ActionPanel, Color, Detail, Icon } from "@raycast/api";
import React from "react";
import { useBtsowDetail } from "../hooks/use-btsow-search";
import { groupBtsowFiles } from "../utils/btsow-files";

export function BtsowSearchDetail(props: { searchResult: BtsowSearchResult }) {
  const { detail, failed, isLoading } = useBtsowDetail(props.searchResult.hash);

  return <Detail isLoading={isLoading} markdown={buildMarkdown(detail, failed)} navigationTitle={detail?.title || props.searchResult.title} metadata={detail ? <DetailMetadata detail={detail} /> : undefined} actions={<DetailActions detail={detail} searchResult={props.searchResult} />} />;
}

function DetailMetadata({ detail }: { detail: BtsowDetailData }) {
  return (
    <Detail.Metadata>
      <Detail.Metadata.Label title="Total Size" text={detail.size} />
      <Detail.Metadata.Label title="Files" text={String(detail.fileCount)} />
      <Detail.Metadata.Label title="Last Updated" text={detail.date} />
      <Detail.Metadata.Label title="Hash" text={detail.hash.slice(0, 16) + "\u2026"} />
      {detail.keywords.length > 0 && (
        <Detail.Metadata.TagList title="Categories">
          {detail.keywords.map((kw) => (
            <Detail.Metadata.TagList.Item key={kw} text={kw} color={Color.Blue} />
          ))}
        </Detail.Metadata.TagList>
      )}
      <Detail.Metadata.Separator />
      <Detail.Metadata.Link title="Source" target={detail.link} text="btsow.pics" />
    </Detail.Metadata>
  );
}

function DetailActions({ detail, searchResult }: { detail?: BtsowDetailData; searchResult: BtsowSearchResult }) {
  const magnet = detail?.magnet || searchResult.magnet;
  const link = detail?.link || searchResult.link;

  return (
    <ActionPanel>
      <ActionPanel.Section>
        <Action.CopyToClipboard title="Copy Magnet Link" content={magnet} icon={Icon.Link} />
      </ActionPanel.Section>
      <ActionPanel.Section title="Copy">
        <Action.CopyToClipboard title="Copy Title" content={detail?.title || searchResult.title} />
        <Action.CopyToClipboard title="Copy Hash" content={detail?.hash || searchResult.hash} />
        <Action.CopyToClipboard title="Copy Link" content={link} />
      </ActionPanel.Section>
      <ActionPanel.Section title="Links">
        <Action.OpenInBrowser title="Open Btsow" url={link} />
      </ActionPanel.Section>
    </ActionPanel>
  );
}

function buildMarkdown(detail: BtsowDetailData | undefined, failed: boolean): string {
  if (failed) return "## Unable to Load Btsow Detail";
  if (!detail) return "Loading...";

  const header = "## " + detail.title + "\n\n> " + detail.magnet + "\n\n---";
  const lines: string[] = [header];

  if (detail.files.length > 0) {
    lines.push("### Files");
    const groups = groupBtsowFiles(detail.files);
    for (const group of groups.priority) {
      lines.push("#### " + group.category + " (" + group.files.length + ")");
      group.files.forEach((file) => lines.push("- **" + file.name + "** — `" + file.size + "`"));
    }
    if (groups.other.length > 0) {
      lines.push("---");
      lines.push(groups.other.map((file) => "> - " + file.name).join("\n"));
    }
  }

  return lines.join("\n\n");
}
