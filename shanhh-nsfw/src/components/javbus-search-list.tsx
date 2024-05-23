import React, { useState } from "react";
import { Action, ActionPanel, List } from "@raycast/api";
import { useJavbusSearch } from "../hooks/use-javbus-search";
import { JavbusSearchResult } from "../types/javbus-search.dt";
import { v4 as uuidv4 } from "uuid";
import { JavbusSearchDetail } from "./javbus-search-detail";


export function JavbusSearchList(props: { searchText: string }) {
  const [searchText, setSearchText] = useState<string>(props.searchText);
  const [type, setType] = useState<string>(props.searchText);
  const { isLoading, data: searchResults, pagination } = useJavbusSearch(type, searchText);

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      navigationTitle="Search Btsow"
      searchBarPlaceholder="Keywords"
      isShowingDetail={(searchResults || [])?.length > 0}
      pagination={pagination}
      searchBarAccessory={
        <List.Dropdown tooltip={"Search Type"} defaultValue={"有码"} value={type} onChange={setType}>
          <List.Dropdown.Item title="有码" value="有码" />
          <List.Dropdown.Item title="无码" value="无码" />
        </List.Dropdown>
      }
      throttle
    >
      {
        (searchResults || []).length == 0 ? (
            <List.EmptyView
              title="No results"
              description="Try another search term"
            />
          ) :
          (searchResults || []).map((result: JavbusSearchResult) => (
              <List.Item key={result.url} title={result.title} accessories={[{ text: result.code }]}
                         detail={<JavbusSearchThumbnail result={result} />}
                         actions={
                           <ActionPanel>
                             <Action.Push title="Open in Browser" target={<JavbusSearchDetail searchResult={result} />} />
                             <Action.OpenInBrowser title="Open in Browser" url={result.url} />
                             <Action.CopyToClipboard title={`Copy ${result.code}`} content={result.code} />
                             <Action.CopyToClipboard title={`Copy ${result.title}`} content={result.title} />
                           </ActionPanel>
                         }
              />
            )
          )
      }
    </List>
  );
}

function JavbusSearchThumbnail(props: { result: JavbusSearchResult }) {
  const result = props.result;
  return (
    <List.Item.Detail
      markdown={
        `![${result.thumbnail}](${result.thumbnail})`
      }
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="标题" text={result.title} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="识别码" text={result.code} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="发行日期" text={result.date} />
          <List.Item.Detail.Metadata.Separator />
          {
            (result.tags || []).map((tag: string) => (
              <List.Item.Detail.Metadata.Label key={uuidv4()} title="标签" text={tag} />
            ))
          }
          {
            (result.tags.length > 0) &&
            <List.Item.Detail.Metadata.Separator />
          }
          <List.Item.Detail.Metadata.Label title="源网址" text={result.url} />
          <List.Item.Detail.Metadata.Separator />
        </List.Item.Detail.Metadata>
      }
    />
  );

}