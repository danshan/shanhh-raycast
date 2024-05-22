import React, { useState } from "react";
import { useBtsowSearch } from "../hooks/use-btsow-search";
import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { BtsowSearchResult } from "../types/search.dt";
import { BtsowSearchDetail } from "./btsow-search-detail";

export function BtsowSearchList(props: { searchText: string }) {
  const [searchText, setSearchText] = useState<string>(props.searchText);
  const { isLoading, data: searchResults, pagination } = useBtsowSearch(searchText);

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      navigationTitle="Search Btsow"
      searchBarPlaceholder="Keywords"
      pagination={pagination}
      throttle
    >
      {
        (searchResults || []).length == 0 ? (
            <List.EmptyView
              title="No results"
              description="Try another search term"
            />
          ) :
          (searchResults || []).map((result: BtsowSearchResult) => (
              <List.Item
                key={result.url}
                title={result.title}
                accessories={[
                  { text: result.size, icon: Icon.Document },
                  { text: result.date, icon: Icon.Calendar }
                ]}
                actions={
                  <ActionPanel>
                    <Action.Push title="Show Detail" target={
                      <BtsowSearchDetail searchResult={result} />
                    } />
                    <Action.CopyToClipboard title="Copy Magnet" content={result?.magnet} />
                    <Action.CopyToClipboard title="Copy Title" content={result?.title} />
                  </ActionPanel>
                } />
            )
          )
      }
    </List>
  );
}