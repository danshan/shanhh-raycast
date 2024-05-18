import { Action, ActionPanel, Color, getPreferenceValues, Icon, List } from "@raycast/api";
import { useState } from "react";
import { TotpList } from "./components/totp-list";

export default function Command() {
  const [searchText, setSearchText] = useState<string>("");

  return (
    <List searchText={searchText} onSearchTextChange={setSearchText}>
      <List.Item key="search-nio-employee" icon={{ source: Icon.Fingerprint, tintColor: Color.Red }} title="Search TOTP" actions={
        <ActionPanel>
          <Action.Push title={"TOTP"} target={
            <TotpList searchText={searchText} />
          } />
        </ActionPanel>
      } />
    </List>
  );

}
