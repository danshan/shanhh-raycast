import React, { useState } from "react";
import { Action, ActionPanel, List } from "@raycast/api";
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
          <List.Dropdown.Item title="有码" value="有码" />
          <List.Dropdown.Item title="无码" value="无码" />
        </List.Dropdown>
      }
      throttle
    >
      <JavbusSearchListItems searchResults={searchResults} />
    </List>
  );
}

export function JavbusSearchUrlList(props: { url: string }) {
  const { isLoading, data: searchResults, pagination } = useJavbusSearchUrl(props.url);

  return (
    <List isLoading={isLoading} filtering={false} navigationTitle="Search Javbus" searchBarPlaceholder="Keywords" isShowingDetail={(searchResults || [])?.length > 0} pagination={pagination} throttle>
      <JavbusSearchListItems searchResults={searchResults} />
    </List>
  );
}

function JavbusSearchListItems(props: { searchResults?: JavbusSearchResult[] }) {
  return (props.searchResults || []).length == 0 ? (
    <List.EmptyView title="No results" description="Try another search term" />
  ) : (
    (props.searchResults || []).map((result: JavbusSearchResult) => (
      <List.Item
        key={result.url}
        title={result.title}
        accessories={[{ text: result.code }]}
        detail={<JavbusSearchThumbnail result={result} />}
        actions={
          <ActionPanel>
            <Action.Push title="Show Detail" target={<JavbusSearchDetail url={result.url} />} />
            <Action.OpenInBrowser title="Open in Browser" url={result.url} />
            <Action.CopyToClipboard title="Copy Link" content={result.url} />
            <Action.CopyToClipboard title={`Copy ${result.code}`} content={result.code} />
            <Action.CopyToClipboard title={`Copy ${result.title}`} content={result.title} />
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
          <List.Item.Detail.Metadata.Label title="标题" text={result.title} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="识别码" text={result.code} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="发行日期" text={result.date} />
          <List.Item.Detail.Metadata.Separator />
          {(result.tags || []).map((tag: string, index: number) => (
            <List.Item.Detail.Metadata.Label key={`${tag}-${index}`} title="标签" text={tag} />
          ))}
          {result.tags.length > 0 && <List.Item.Detail.Metadata.Separator />}
          <List.Item.Detail.Metadata.Label title="源网址" text={result.url} />
          <List.Item.Detail.Metadata.Separator />
        </List.Item.Detail.Metadata>
      }
    />
  );
}
