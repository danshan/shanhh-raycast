import { Action, ActionPanel, Detail } from "@raycast/api";
import React from "react";
import { JavbusDetailData, JavbusSearchResult } from "../types/javbus-search.dt";
import { useJavbusDetail } from "../hooks/use-javbus-search";
import { JavbusMagnetList } from "./javbus-magent-list";

export function JavbusSearchDetail(props: { searchResult: JavbusSearchResult }) {
  const { isLoading, detail } = useJavbusDetail(props.searchResult.url);

  return (
    <Detail
      isLoading={isLoading}
      markdown={getMarkdown(detail)}
      metadata={detail ? (
        <Detail.Metadata>
          <Detail.Metadata.Label title="Code" text={detail.code} />
          <Detail.Metadata.Label title="Release Date" text={detail.date} />
          <Detail.Metadata.Label title="Duration" text={detail.duration} />
          <Detail.Metadata.Label title="Director" text={detail.director} />
          <Detail.Metadata.Label title="Producer" text={detail.producer} />
          <Detail.Metadata.Label title="Publisher" text={detail.publisher} />
          {
            detail.category && detail.category.length > 0 &&
            <Detail.Metadata.TagList title="Category">
              {(detail.category).map((cate) => (
                <Detail.Metadata.TagList.Item key={cate} text={cate} />
              ))}
            </Detail.Metadata.TagList>
          }
          {
            detail.actors && detail.actors.length > 0 &&
            <Detail.Metadata.TagList title="Actors">
              {(detail.actors).map((actor) => (
                <Detail.Metadata.TagList.Item key={actor} text={actor} />
              ))}
            </Detail.Metadata.TagList>
          }
          <Detail.Metadata.Separator />
          <Detail.Metadata.Link title="Source URL" text={"From javbus.com"} target={props.searchResult.url} />
        </Detail.Metadata>
      ) : null}
      actions={
        <ActionPanel>
          <Action.Push title="Search Magents" target={<JavbusMagnetList detail={detail} />} />
          <Action.OpenInBrowser title="Open in Browser" url={props.searchResult.url} />
          <Action.CopyToClipboard title="Copy URL" content={props.searchResult.url} />
        </ActionPanel>
      }
    />
  );

}

function getMarkdown(detail?: JavbusDetailData) {
  let markdown = "Loading...";
  if (detail) {
    markdown = `## ${detail.title}\n\n`;
    markdown += `![${detail.thumbnail}](${detail.thumbnail})\n\n`;
    if (detail.images.length > 0) {
      markdown += "### Images\n\n";
      markdown += `${detail.images.map((image) => `![${image}](${image})`).join(" ")}`;
    }
  }
  return markdown;
}
