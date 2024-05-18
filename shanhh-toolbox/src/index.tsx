import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useState } from "react";
import { TotpList } from "./components/totp-list";
import { MyIpList } from "./components/my-ip-list";

export default function Command() {
  const [searchText, setSearchText] = useState<string>("");

  return (
    <List searchText={searchText} onSearchTextChange={setSearchText}>
      <List.Item key="totp" icon={{ source: Icon.Fingerprint, tintColor: Color.Red }} title="Search TOTP" actions={
        <ActionPanel>
          <Action.Push title={"TOTP"} target={
            <TotpList searchText={searchText} />
          } />
        </ActionPanel>
      } />
      <List.Item key="my-ip" icon={{ source: Icon.Network, tintColor: Color.Red }} title="My IP" actions={
        <ActionPanel>
          <Action.Push title={"My IP"} target={
            <MyIpList />
          } />
        </ActionPanel>
      } />
    </List>
  );

}
