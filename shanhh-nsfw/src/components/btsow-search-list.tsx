import React, { useState } from "react";
import { useBtsowSearch } from "../hooks/use-btsow-search";
import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { BtsowSearchResult } from "../types/btsow-search";
import { BtsowSearchDetail } from "./btsow-search-detail";

export function BtsowSearchList(props: { searchText: string }) {
  const [searchText, setSearchText] = useState<string>(props.searchText);
  const { isLoading, data: searchResults, pagination } = useBtsowSearch(searchText);

  return (
    <List isLoading={isLoading} filtering={false} searchText={searchText} onSearchTextChange={setSearchText} navigationTitle="Search Btsow" searchBarPlaceholder="Keywords" pagination={pagination} throttle>
      {(searchResults || []).length === 0 ? (
        <List.EmptyView icon={Icon.MagnifyingGlass} title={searchText ? "No Btsow Results" : "Search Btsow"} description={searchText ? "Try another search term." : "Enter keywords to search torrent metadata."} />
      ) : (
        (searchResults || []).map((result: BtsowSearchResult) => (
          <List.Item
            key={result.hash}
            icon={{ source: Icon.HardDrive, tintColor: Color.Blue }}
            title={result.title}
            accessories={[{ tag: result.size }, { text: result.date, icon: Icon.Calendar }]}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action.Push title="Show Details" target={<BtsowSearchDetail searchResult={result} />} icon={Icon.Sidebar} />
                </ActionPanel.Section>
                <ActionPanel.Section title="Copy">
                  <Action.CopyToClipboard title="Copy Magnet Link" content={result.magnet} />
                  <Action.CopyToClipboard title="Copy Title" content={result.title} />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}
