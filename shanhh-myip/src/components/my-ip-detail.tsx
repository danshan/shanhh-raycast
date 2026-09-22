import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useEffect, useState } from "react";
import { IpLookupData, lookupIp } from "../clients/ip-client";

type LookupField = { key: string; label: string };

const fieldSections: { title: string; fields: LookupField[] }[] = [
  {
    title: "Network",
    fields: [
      { key: "ip", label: "IP Address" },
      { key: "asn", label: "ASN" },
      { key: "org", label: "Organization" },
    ],
  },
  {
    title: "Location",
    fields: [
      { key: "city", label: "City" },
      { key: "region", label: "Region" },
      { key: "country_name", label: "Country" },
      { key: "country_code", label: "Country Code" },
      { key: "postal", label: "Postal Code" },
      { key: "latitude", label: "Latitude" },
      { key: "longitude", label: "Longitude" },
    ],
  },
  {
    title: "Regional",
    fields: [
      { key: "timezone", label: "Time Zone" },
      { key: "utc_offset", label: "UTC Offset" },
      { key: "country_calling_code", label: "Calling Code" },
      { key: "currency", label: "Currency" },
      { key: "languages", label: "Languages" },
      { key: "in_eu", label: "European Union" },
    ],
  },
];

export default function IpLookup({ ip }: { ip: string }) {
  const [data, setData] = useState<IpLookupData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);
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
    <List isLoading={isLoading} navigationTitle="IP Details">
      {failed && <List.EmptyView icon={Icon.Warning} title="IP Lookup Failed" description="The lookup service is temporarily unavailable." />}
      {!failed &&
        fieldSections.map((section) => (
          <List.Section key={section.title} title={section.title}>
            {section.fields.map(({ key, label }) => {
              const value = data[key];
              if (value === null || value === undefined) return null;
              const formattedValue = formatValue(value);
              return (
                <List.Item
                  key={key}
                  title={label}
                  accessories={[{ text: formattedValue }]}
                  actions={
                    <ActionPanel>
                      <ActionPanel.Section>
                        <Action.CopyToClipboard title={`Copy ${label}`} content={formattedValue} />
                      </ActionPanel.Section>
                      <ActionPanel.Section title="Links">
                        <Action.OpenInBrowser title="Open Lookup Page" url={`https://ipapi.co/?q=${encodeURIComponent(ip)}`} />
                      </ActionPanel.Section>
                    </ActionPanel>
                  }
                />
              );
            })}
          </List.Section>
        ))}
    </List>
  );
}

function formatValue(value: string | number | boolean): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
