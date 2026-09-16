import { Action, ActionPanel, Icon, List, useNavigation } from "@raycast/api";
import { address } from "ip";
import { useEffect, useState } from "react";
import { getChineseIp, getGlobalIp } from "../clients/ip-client";
import IpLookup from "./my-ip-detail";

type LoadingStatus = "loading" | "success" | "failure";

export function MyIpList() {
  const [globalStatus, setGlobalStatus] = useState<LoadingStatus>("loading");
  const [chineseStatus, setChineseStatus] = useState<LoadingStatus>("loading");
  const [globalIp, setGlobalIp] = useState("");
  const [chineseIp, setChineseIp] = useState("");
  const [localIp] = useState(() => address("public", "ipv4").toString());
  const { pop } = useNavigation();

  useEffect(() => {
    let active = true;

    void getGlobalIp()
      .then((ip) => {
        if (!active) return;
        setGlobalIp(ip);
        setGlobalStatus("success");
      })
      .catch(() => {
        if (!active) return;
        setGlobalIp("Unavailable");
        setGlobalStatus("failure");
      });

    void getChineseIp()
      .then((ip) => {
        if (!active) return;
        setChineseIp(ip);
        setChineseStatus("success");
      })
      .catch(() => {
        if (!active) return;
        setChineseIp("Unavailable");
        setChineseStatus("failure");
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <List isLoading={globalStatus === "loading" || chineseStatus === "loading"}>
      <IpItem label="Local IP Address" ip={localIp} onCopy={pop} />
      <IpItem label="Public Chinese IP Address" ip={chineseIp} onCopy={pop} />
      {chineseStatus === "success" && <LookupItem label="Chinese IP Lookup" ip={chineseIp} />}
      <IpItem label="Public Global IP Address" ip={globalIp} onCopy={pop} />
      {globalStatus === "success" && <LookupItem label="Global IP Lookup" ip={globalIp} />}
    </List>
  );
}

function IpItem({ label, ip, onCopy }: { label: string; ip: string; onCopy: () => void }) {
  return (
    <List.Item
      icon={label.startsWith("Local") ? Icon.Desktop : Icon.Globe}
      title={ip}
      subtitle={!ip ? "Loading..." : undefined}
      accessories={[{ text: label }]}
      actions={
        ip && ip !== "Unavailable" ? (
          <ActionPanel>
            <Action.CopyToClipboard content={ip} onCopy={onCopy} />
          </ActionPanel>
        ) : undefined
      }
    />
  );
}

function LookupItem({ label, ip }: { label: string; ip: string }) {
  return (
    <List.Item
      icon={Icon.Eye}
      title=""
      subtitle={label}
      accessories={[{ text: `Details of ${label.toLowerCase()}` }]}
      actions={
        <ActionPanel>
          <Action.Push title={label} target={<IpLookup ip={ip} />} icon={Icon.Eye} />
        </ActionPanel>
      }
    />
  );
}
