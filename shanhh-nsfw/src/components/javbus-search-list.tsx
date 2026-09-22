import React, { useState } from "react";
import { Action, ActionPanel, Color, Icon, Image, List } from "@raycast/api";
import { useJavbusSearchText, useJavbusSearchUrl } from "../hooks/use-javbus-search";
import { JavbusSearchResult } from "../types/javbus-search";
import { JavbusSearchDetail } from "./javbus-search-detail";

export function JavbusSearchTextList(props: { searchText: string }) {
  const [searchText, setSearchText] = useState<string>(props.searchText);
  const [type, setType] = useState<"有码" | "无码">("有码");
  const { isLoading, data: searchResults, pagination } = useJavbusSearchText(type, searchText);

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      navigationTitle="Search Javbus"
      searchBarPlaceholder="Keywords"
      isShowingDetail={(searchResults || [])?.length > 0}
      pagination={pagination}
      searchBarAccessory={
        <List.Dropdown tooltip="Search Type" value={type} onChange={(value) => setType(value as "有码" | "无码")}>
          <List.Dropdown.Item title="Censored" value="有码" icon={Icon.Shield} />
          <List.Dropdown.Item title="Uncensored" value="无码" icon={Icon.LockUnlocked} />
        </List.Dropdown>
      }
      throttle
    >
      <JavbusSearchListItems searchResults={searchResults} hasQuery={Boolean(searchText)} />
    </List>
  );
}

export function JavbusSearchUrlList(props: { url: string }) {
  const { isLoading, data: searchResults, pagination } = useJavbusSearchUrl(props.url);

  return (
    <List isLoading={isLoading} filtering={false} navigationTitle="Search Javbus" searchBarPlaceholder="Keywords" isShowingDetail={(searchResults || [])?.length > 0} pagination={pagination} throttle>
      <JavbusSearchListItems searchResults={searchResults} hasQuery />
    </List>
  );
}

function JavbusSearchListItems(props: { searchResults?: JavbusSearchResult[]; hasQuery: boolean }) {
  return (props.searchResults || []).length === 0 ? (
    <List.EmptyView icon={props.hasQuery ? Icon.MagnifyingGlass : Icon.FilmStrip} title={props.hasQuery ? "No JavBus Results" : "Search JavBus"} description={props.hasQuery ? "Try another title, code, or keyword." : "Enter a title, code, or keyword to search."} />
  ) : (
    (props.searchResults || []).map((result: JavbusSearchResult) => (
      <List.Item
        key={result.url}
        icon={{ source: result.thumbnail, fallback: Icon.FilmStrip, mask: Image.Mask.RoundedRectangle }}
        title={result.title}
        accessories={[{ tag: { value: result.code, color: Color.Purple } }, { text: result.date, icon: Icon.Calendar }]}
        detail={<JavbusSearchThumbnail result={result} />}
        actions={
          <ActionPanel>
            <ActionPanel.Section>
              <Action.Push title="Show Details" target={<JavbusSearchDetail url={result.url} />} icon={Icon.Sidebar} />
            </ActionPanel.Section>
            <ActionPanel.Section title="Copy">
              <Action.CopyToClipboard title="Copy Code" content={result.code} />
              <Action.CopyToClipboard title="Copy Title" content={result.title} />
              <Action.CopyToClipboard title="Copy URL" content={result.url} />
            </ActionPanel.Section>
            <ActionPanel.Section title="Links">
              <Action.OpenInBrowser title="Open Javbus" url={result.url} />
            </ActionPanel.Section>
          </ActionPanel>
        }
      />
    ))
  );
}

function JavbusSearchThumbnail(props: { result: JavbusSearchResult }) {
  const result = props.result;
  return (
    <List.Item.Detail
      markdown={`![${result.thumbnail}](${result.thumbnail})`}
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="Title" text={result.title} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Code" text={result.code} />
          <List.Item.Detail.Metadata.Label title="Release Date" text={result.date} />
          <List.Item.Detail.Metadata.Separator />
          {result.tags.length > 0 && (
            <List.Item.Detail.Metadata.TagList title="Tags">
              {result.tags.map((tag: string, index: number) => (
                <List.Item.Detail.Metadata.TagList.Item key={`${tag}-${index}`} text={tag} />
              ))}
            </List.Item.Detail.Metadata.TagList>
          )}
          <List.Item.Detail.Metadata.Link title="Source" target={result.url} text="JavBus" />
        </List.Item.Detail.Metadata>
      }
    />
  );
}
