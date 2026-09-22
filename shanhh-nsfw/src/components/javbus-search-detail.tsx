import { Action, ActionPanel, Color, Detail, Icon } from "@raycast/api";
import React from "react";
import { JavbusDetailData } from "../types/javbus-search";
import { useJavbusDetail } from "../hooks/use-javbus-search";
import { JavbusMagnetList } from "./javbus-magnet-list";
import { JavbusSearchUrlList } from "./javbus-search-list";

export function JavbusSearchDetail(props: { url: string }) {
  const { isLoading, detail, failed } = useJavbusDetail(props.url);

  return (
    <Detail
      isLoading={isLoading}
      markdown={getMarkdown(detail, failed)}
      metadata={
        detail ? (
          <Detail.Metadata>
            <Detail.Metadata.Label title="Code" text={detail.code} />
            <Detail.Metadata.Label title="Release Date" text={detail.date} />
            <Detail.Metadata.Label title="Duration" text={detail.duration} />
            <Detail.Metadata.Label title="Director" text={detail.director?.title} />
            <Detail.Metadata.Label title="Producer" text={detail.producer?.title} />
            <Detail.Metadata.Label title="Publisher" text={detail.publisher?.title} />
            {detail.series?.title && <Detail.Metadata.Label title="Series" text={detail.series.title} />}
            <Detail.Metadata.Separator />
            {detail.category && detail.category.length > 0 && (
              <Detail.Metadata.TagList title="Category">
                {detail.category.map((cate) => (
                  <Detail.Metadata.TagList.Item key={cate.title} text={cate.title} />
                ))}
              </Detail.Metadata.TagList>
            )}
            {detail.actors && detail.actors.length > 0 && (
              <Detail.Metadata.TagList title="Actors">
                {detail.actors.map((actor) => (
                  <Detail.Metadata.TagList.Item key={actor.title} text={actor.title} />
                ))}
              </Detail.Metadata.TagList>
            )}
            <Detail.Metadata.Separator />
            <Detail.Metadata.Link title="Source" text="JavBus" target={props.url} />
          </Detail.Metadata>
        ) : null
      }
      actions={
        <ActionPanel>
          <ActionPanel.Section>{detail?.magnetSearchUrl && <Action.Push title="Show Magnet Links" target={<JavbusMagnetList detail={detail} />} icon={Icon.Download} />}</ActionPanel.Section>
          <ActionPanel.Section title="Related Search">
            {detail?.series?.url && <Action.Push title="Browse Series" target={<JavbusSearchUrlList url={detail.series.url} />} icon={Icon.List} />}
            {(detail?.actors || []).map((actor) => (
              <Action.Push key={actor.url} title={`Browse ${actor.title}`} target={<JavbusSearchUrlList url={actor.url} />} icon={{ source: Icon.Person, tintColor: Color.Blue }} />
            ))}
            {(detail?.category || []).map((category) => (
              <Action.Push key={category.url} title={`Browse ${category.title}`} target={<JavbusSearchUrlList url={category.url} />} icon={{ source: Icon.Tag, tintColor: Color.Green }} />
            ))}
          </ActionPanel.Section>
          <ActionPanel.Section title="Copy">
            <Action.CopyToClipboard title="Copy Code" content={detail?.code || ""} />
            <Action.CopyToClipboard title="Copy Title" content={detail?.title || ""} />
            <Action.CopyToClipboard title="Copy URL" content={props.url} />
          </ActionPanel.Section>
          <ActionPanel.Section title="Links">
            <Action.OpenInBrowser title="Open Javbus" url={props.url} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}

function getMarkdown(detail: JavbusDetailData | undefined, failed: boolean) {
  if (failed) return "## Unable to Load JavBus Detail";

  let markdown = "Loading...";
  if (detail) {
    markdown = `## ${detail.title}\n\n`;
    markdown += `![${detail.code}](${detail.thumbnail})\n\n`;
    if (detail.images.length > 0) {
      markdown += "### Images\n\n";
      markdown += `${detail.images.map((image) => `![${image}](${image})`).join(" ")}`;
    }
  }
  return markdown;
}
