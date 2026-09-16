import { Action, ActionPanel, getPreferenceValues, List } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import * as fs from "fs";
import { createTotpEntries, getTimeRemaining, parseOtpConfigs } from "../utils/totp";

interface Preferences {
  authFile: string;
}

export function TotpList() {
  const { authFile } = getPreferenceValues<Preferences>();
  const [searchText, setSearchText] = useState("");
  const [now, setNow] = useState(Date.now());
  const window = Math.trunc(now / 30_000);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  const configResult = useMemo(() => {
    try {
      return { configs: parseOtpConfigs(fs.readFileSync(authFile, "utf8")), error: undefined };
    } catch {
      return { configs: [], error: "Unable to load TOTP configuration." };
    }
  }, [authFile]);

  const entriesResult = useMemo(() => {
    try {
      return { entries: createTotpEntries(configResult.configs), error: configResult.error };
    } catch {
      return { entries: [], error: "Unable to generate TOTP codes." };
    }
  }, [configResult, window]);

  const filteredList = useMemo(() => {
    const query = searchText.toLowerCase();
    if (!query) return entriesResult.entries;
    return entriesResult.entries.filter((item) => item.account.toLowerCase().includes(query) || item.website.toLowerCase().includes(query));
  }, [entriesResult.entries, searchText]);

  return (
    <List filtering={false} searchBarPlaceholder="Search TOTP" searchText={searchText} onSearchTextChange={setSearchText} navigationTitle={`Time Remaining: ${getTimeRemaining(now)}`}>
      {entriesResult.error && <List.EmptyView title="Unable to Load TOTP" description={entriesResult.error} />}
      {filteredList.map((config) => (
        <List.Item
          key={config.id}
          icon="list-icon.png"
          title={config.website || ""}
          subtitle={config.account || ""}
          accessories={[{ tag: config.code || "" }]}
          actions={
            <ActionPanel>
              <ActionPanel.Section title="Copy">
                <Action.Paste title="Fill Code" content={config.code} />
                <Action.CopyToClipboard title="Copy Code" content={config.code} />
                <Action.CopyToClipboard title="Copy Configuration" content={config.uri} />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
