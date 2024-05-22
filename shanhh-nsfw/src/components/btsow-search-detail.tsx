import { BtsowDetailData, BtsowSearchResult } from "../types/search.dt";
import { Action, ActionPanel, Color, Detail } from "@raycast/api";
import React from "react";
import { useBtsowDetail } from "../hooks/use-btsow-search";

export function BtsowSearchDetail(props: { searchResult: BtsowSearchResult }) {
  const { isLoading, detail } = useBtsowDetail(props.searchResult.url);

  return (
    <Detail
      isLoading={isLoading}
      markdown={getMarkdown(detail)}
      metadata={
        <Detail.Metadata>
          <Detail.Metadata.Label title="Torrent Hash" text={detail?.hash} />
          <Detail.Metadata.Label title="Number of Files" text={detail?.count} />
          <Detail.Metadata.Label title="Content Size" text={detail?.size} />
          <Detail.Metadata.Label title="Convert On" text={detail?.date} />
          <Detail.Metadata.TagList title="Keywords">
            {detail?.keywords.map((keyword) => (
              <Detail.Metadata.TagList.Item key={keyword} text={keyword} color={Color.SecondaryText} />
            ))}
          </Detail.Metadata.TagList>
          <Detail.Metadata.Separator />
          <Detail.Metadata.Link
            title="Link"
            target={detail?.link || ""}
            text="From http://btsow.com"
          />
        </Detail.Metadata>
      }
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Magnet" content={detail?.magnet || ""} />
          <Action.CopyToClipboard title="Copy Title" content={detail?.title || ""} />
        </ActionPanel>
      } />
  );

}

function getMarkdown(detail?: BtsowDetailData) {
  let markdown = "Loading...";
  if (detail) {
    markdown = `### ${detail.title}\n\n`;
    markdown += `> ${detail.magnet}\n\n`;
    markdown += `---\n\n`;
    if (detail.files.length > 0) {
      markdown += "#### File Name & Size\n\n";
      detail.files.forEach((item) => {
        markdown += `* ${getEmoji(item.type)} ${item.name} - [${item.size}]\n`;
      });
    }
  }
  return markdown;
}

// 辅助函数
const getEmoji = (type: string[]) => {
  if (type.includes("glyphicon-bookmark")) {
    return "📖";
  } else if (type.includes("glyphicon-film")) {
    return "🎬";
  } else if (type.includes("glyphicon-picture")) {
    return "🖼";
  } else if (type.includes("glyphicon-file")) {
    return "📄";
  } else if (type.includes("glyphicon-book")) {
    return "📕";
  } else {
    return "";
  }
};