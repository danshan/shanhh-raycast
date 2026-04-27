import { Action, ActionPanel, getPreferenceValues, List } from "@raycast/api";
import { useMemo, useState } from "react";
import { Secret, TOTP } from "otpauth";
import * as fs from "fs";

const _preps = getPreferenceValues<Preps>();

const otpConfigs: OtpConfig[] = JSON.parse(fs.readFileSync(_preps.authFile, "utf8"));

const totpEntries = otpConfigs.map((item) => {
  const totp = new TOTP({
    issuer: item.website || "",
    label: item.account || "",
    secret: Secret.fromBase32(item.secret.replaceAll(/\s*/g, "")),
  });
  return { ...item, code: totp.generate(), uri: totp.toString() };
});

const getTimeRemaining = function () {
  return 30 - (Math.trunc(new Date().valueOf() / 1000) % 30);
};

export function TotpList() {
  const [searchText, setSearchText] = useState<string>("");

  const filteredList = useMemo(() => {
    if (!searchText) return totpEntries;
    return totpEntries.filter(
      (item) => item.account.includes(searchText) || item.website.includes(searchText),
    );
  }, [searchText]);

  return (
    <List
      filtering={false}
      searchBarPlaceholder="Search TOTP"
      searchText={searchText}
      onSearchTextChange={setSearchText}
      navigationTitle={`Time Remaining: ${getTimeRemaining()}`}
    >
      {filteredList.map((config) => (
        <List.Item
          key={config.secret}
          icon="list-icon.png"
          title={config.website || ""}
          subtitle={config.account || ""}
          accessories={[{ tag: config.code || "" }]}
          actions={
            <ActionPanel>
              <ActionPanel.Section title="Copy">
                <Action.Paste title="Fill the OTP code" content={config.code} />
                <Action.CopyToClipboard title="Copy the OTP code" content={config.code} />
                <Action.CopyToClipboard title="Copy the OTP URI" content={config.uri} />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
