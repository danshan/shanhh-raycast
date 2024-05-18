import { Action, ActionPanel, List, useNavigation } from "@raycast/api";
import got from "got";
import { useEffect, useState } from "react";
import { LoadingStatus } from "./my-ip-list";

const showItems: { [key: string]: string } = {
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
  org: "Org"
};

export default function LookUp(param: { ip: string }) {
  const [status, setStatus] = useState<LoadingStatus>("loading");
  const [data, setData] = useState<{ [key: string]: string | number }>({});
  const { pop } = useNavigation();

  useEffect(() => {
      async function getIp() {
        try {
          console.log("param1", param);
          const url = `https://ipapi.co/${param.ip}/json`;
          const data = JSON.parse((await got.get(url)).body);
          setData(data);
          setStatus("success");
        } catch (error) {
          setStatus("failure");
        }
      }

      console.log("param", param);
      getIp();
    }, []
  );

  return (
    <List isLoading={status === "loading"} navigationTitle="IP Lookup" actions={
      <ActionPanel>
        <Action.OpenInBrowser url={"https://ipapi.co"} onOpen={() => {
          pop();
        }}
        />
      </ActionPanel>
    }
    >
      {Object.keys(data).map(
        (key) =>
          Object.prototype.hasOwnProperty.call(showItems, key) && (data[key]) && (
            <List.Item key={key} title={showItems[key]} accessories={[{ text: (data[key] || "").toString() }]} actions={
              <ActionPanel>
                <Action.CopyToClipboard title={`Copy to ${showItems[key]}`} content={data[key].toString()} />
                <Action.OpenInBrowser url={`https://ipapi.co/?q=${param.ip}`} onOpen={() => {
                  pop();
                }}
                />
              </ActionPanel>
            }
            />
          )
      )}
    </List>
  );
}