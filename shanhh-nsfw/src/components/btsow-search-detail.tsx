import { BtsowDetailData, BtsowSearchResult } from "../types/btsow-search";
import { Action, ActionPanel, Color, Detail } from "@raycast/api";
import React from "react";
import { useBtsowDetail } from "../hooks/use-btsow-search";

const FILE_EMOJI: Record<string, string> = {
  ".mkv": "🎬",
  ".mp4": "🎬",
  ".avi": "🎬",
  ".wmv": "🎬",
  ".flv": "🎬",
  ".mov": "🎬",
  ".webm": "🎬",
  ".ts": "🎬",
  ".m2ts": "🎬",
  ".mp3": "🎵",
  ".flac": "🎵",
  ".wav": "🎵",
  ".aac": "🎵",
  ".ogg": "🎵",
  ".m4a": "🎵",
  ".jpg": "🖼",
  ".jpeg": "🖼",
  ".png": "🖼",
  ".gif": "🖼",
  ".bmp": "🖼",
  ".webp": "🖼",
  ".svg": "🖼",
  ".pdf": "📕",
  ".epub": "📕",
  ".mobi": "📕",
  ".txt": "📝",
  ".srt": "📝",
  ".ass": "📝",
  ".nfo": "📝",
  ".zip": "📦",
  ".rar": "📦",
  ".7z": "📦",
  ".tar": "📦",
  ".gz": "📦",
};

function getFileEmoji(filename: string): string {
  const dotIdx = filename.lastIndexOf(".");
  if (dotIdx >= 0) {
    const ext = filename.slice(dotIdx).toLowerCase();
    return FILE_EMOJI[ext] || "📄";
  }
  return "📄";
}

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
        <Action.CopyToClipboard title="Copy Magnet Link" content={magnet} />
      </ActionPanel.Section>
      <ActionPanel.Section title="Copy">
        <Action.CopyToClipboard title="Copy Title" content={detail?.title || searchResult.title} />
        <Action.CopyToClipboard title="Copy Hash" content={detail?.hash || searchResult.hash} />
        <Action.CopyToClipboard title="Copy Link" content={link} />
      </ActionPanel.Section>
      <ActionPanel.Section title="Links">
        <Action.OpenInBrowser title="Open in Browser" url={link} />
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
    detail.files.forEach((f) => {
      lines.push(getFileEmoji(f.name) + " **" + f.name + "** `" + f.size + "`");
    });
  }

  return lines.join("\n\n");
}
