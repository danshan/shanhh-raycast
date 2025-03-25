import { Action, ActionPanel, List } from "@raycast/api";
import { BtsowSearchList } from "./components/btsow-search-list";
import { useState } from "react";
import { JavbusSearchTextList } from "./components/javbus-search-list";

export default function Command() {
  const [searchText, setSearchText] = useState<string>("");

  return (
    <List
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Baike keywords"
    >
      <List.Item
        icon="list-icon.png"
        title="Btsow Search"
        actions={
          <ActionPanel>
            <Action.Push title="Search Btsow" target={<BtsowSearchList searchText={searchText} />} />
          </ActionPanel>
        }
      />
      <List.Item
        icon="list-icon.png"
        title="Javbus Search"
        actions={
          <ActionPanel>
            <Action.Push title="Search Javbus" target={<JavbusSearchTextList searchText={searchText} />} />
          </ActionPanel>
        }

      />
    </List>
  );
}
