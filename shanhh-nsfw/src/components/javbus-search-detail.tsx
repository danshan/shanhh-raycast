import { Action, ActionPanel, Color, Detail, Icon } from "@raycast/api";
import React from "react";
import { JavbusDetailData } from "../types/javbus-search.dt";
import { useJavbusDetail } from "../hooks/use-javbus-search";
import { JavbusMagnetList } from "./javbus-magent-list";
import { JavbusSearchUrlList } from "./javbus-search-list";

export function JavbusSearchDetail(props: { url: string }) {
  const { isLoading, detail } = useJavbusDetail(props.url);

  return (
    <Detail
      isLoading={isLoading}
      markdown={getMarkdown(detail)}
      metadata={detail ? (
        <Detail.Metadata>
          <Detail.Metadata.Label title="Code" text={detail.code} />
          <Detail.Metadata.Label title="Release Date" text={detail.date} />
          <Detail.Metadata.Label title="Duration" text={detail.duration} />
          <Detail.Metadata.Label title="Director" text={detail.director?.title} />
          <Detail.Metadata.Label title="Producer" text={detail.producer?.title} />
          <Detail.Metadata.Label title="Publisher" text={detail.publisher?.title} />
          {
            detail.category && detail.category.length > 0 &&
            <Detail.Metadata.TagList title="Category">
              {(detail.category).map((cate) => (
                <Detail.Metadata.TagList.Item key={cate.title} text={cate.title} />
              ))}
            </Detail.Metadata.TagList>
          }
          {
            detail.actors && detail.actors.length > 0 &&
            <Detail.Metadata.TagList title="Actors">
              {(detail.actors).map((actor) => (
                <Detail.Metadata.TagList.Item key={actor.title} text={actor.title} />
              ))}
            </Detail.Metadata.TagList>
          }
          <Detail.Metadata.Separator />
          <Detail.Metadata.Link title="Source URL" text={"From javbus.com"} target={props.url} />
        </Detail.Metadata>
      ) : null}
      actions={
        <ActionPanel>
          <Action.Push title="Search Magents" target={<JavbusMagnetList detail={detail} />} icon={{ source : Icon.Download }} />
          {
            detail?.series?.url &&
            <Action.Push title="Search Series" target={<JavbusSearchUrlList url={detail?.series?.url || ""} />} icon={{ source : Icon.List}}/>
          }
          {
            (detail?.actors || []).map((actor) => (
              <Action.Push title={`Search ${actor.title}`} target={<JavbusSearchUrlList url={actor.url || ""} />} icon={{ source : Icon.Person, tintColor: Color.Blue}}/>
            ))
          }
          {
            (detail?.category || []).map((cate) => (
              <Action.Push title={`Search ${cate.title}`} target={<JavbusSearchUrlList url={cate.url || ""} />} icon={{ source : Icon.Tag, tintColor: Color.Green}}/>
            ))
          }
          <Action.OpenInBrowser title="Open in Browser" url={props.url} />
          <Action.CopyToClipboard title="Copy URL" content={props.url} />
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
