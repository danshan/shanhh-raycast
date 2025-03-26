import { ActionPanel, Action, Icon, List, Color } from "@raycast/api";
import { useState } from "react";
import { SearchDocListCmp } from "./components/search-doc-list-cmp";

export default function Command() {
  const [searchText, setSearchText] = useState<string>("");

  return (
    <List searchText={searchText} onSearchTextChange={setSearchText}>
      <List.Item
        key="search-feishu-docs"
        icon={{ source: Icon.Document, tintColor: Color.Blue }}
        title="Search Docs"
        actions={
          <ActionPanel>
            <Action.Push title="Search Feishu Docs" target={<SearchDocListCmp searchText={searchText} />} />
          </ActionPanel>
        }
      />
    </List>
  );
}
