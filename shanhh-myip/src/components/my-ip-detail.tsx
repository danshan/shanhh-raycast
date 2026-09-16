import { Action, ActionPanel, List, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { IpLookupData, lookupIp } from "../clients/ip-client";

const labels: Record<string, string> = {
  ip: "IP Address",
  city: "City",
  region: "Region",
  country_name: "Country",
  country_code: "Country Code",
  postal: "Postal Code",
  in_eu: "European Union",
  latitude: "Latitude",
  longitude: "Longitude",
  timezone: "Time Zone",
  utc_offset: "UTC Offset",
  country_calling_code: "Calling Code",
  currency: "Currency",
  languages: "Languages",
  asn: "ASN",
  org: "Org",
};

export default function IpLookup({ ip }: { ip: string }) {
  const [data, setData] = useState<IpLookupData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { pop } = useNavigation();

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setFailed(false);

    void lookupIp(ip)
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ip]);

  return (
    <List
      isLoading={isLoading}
      navigationTitle="IP Lookup"
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url="https://ipapi.co" onOpen={pop} />
        </ActionPanel>
      }
    >
      {failed && <List.EmptyView title="IP Lookup Failed" description="The lookup service is unavailable." />}
      {!failed &&
        Object.entries(labels).map(([key, label]) => {
          const value = data[key];
          if (value === null || value === undefined) return null;
          return (
            <List.Item
              key={key}
              title={label}
              accessories={[{ text: String(value) }]}
              actions={
                <ActionPanel>
                  <Action.CopyToClipboard title={`Copy ${label}`} content={String(value)} />
                  <Action.OpenInBrowser url={`https://ipapi.co/?q=${encodeURIComponent(ip)}`} onOpen={pop} />
                </ActionPanel>
              }
            />
          );
        })}
    </List>
  );
}
