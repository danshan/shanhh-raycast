import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { BtsowSearchList } from "./components/btsow-search-list";
import { useState } from "react";
import { JavbusSearchTextList } from "./components/javbus-search-list";

export default function Command() {
  const [searchText, setSearchText] = useState<string>("");

  return (
    <List searchText={searchText} onSearchTextChange={setSearchText} searchBarPlaceholder="Search by title, code, or keywords">
      <List.Section title="Search Sources">
        <List.Item
          icon={{ source: Icon.MagnifyingGlass, tintColor: Color.Orange }}
          title="Btsow"
          subtitle="Search torrent metadata and file details"
          actions={
            <ActionPanel>
              <Action.Push title="Search Btsow" target={<BtsowSearchList searchText={searchText} />} icon={Icon.MagnifyingGlass} />
            </ActionPanel>
          }
        />
        <List.Item
          icon={{ source: Icon.FilmStrip, tintColor: Color.Magenta }}
          title="JavBus"
          subtitle="Browse titles, details, and magnet links"
          actions={
            <ActionPanel>
              <Action.Push title="Search Javbus" target={<JavbusSearchTextList searchText={searchText} />} icon={Icon.FilmStrip} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}
