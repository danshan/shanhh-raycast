import { Action, ActionPanel, Color, Icon, List, useNavigation } from "@raycast/api";
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
      <List.Section title="Local Network">
        <IpItem label="Local IP Address" scope="Local" ip={localIp} status="success" onCopy={pop} />
      </List.Section>
      <List.Section title="Public Network">
        <IpItem label="Chinese Public IP Address" scope="China" ip={chineseIp} status={chineseStatus} onCopy={pop} supportsLookup />
        <IpItem label="Global Public IP Address" scope="Global" ip={globalIp} status={globalStatus} onCopy={pop} supportsLookup />
      </List.Section>
    </List>
  );
}

type IpItemProps = {
  label: string;
  scope: "Local" | "China" | "Global";
  ip: string;
  status: LoadingStatus;
  onCopy: () => void;
  supportsLookup?: boolean;
};

const scopeColors: Record<IpItemProps["scope"], Color> = {
  Local: Color.Blue,
  China: Color.Orange,
  Global: Color.Green,
};

function IpItem({ label, scope, ip, status, onCopy, supportsLookup = false }: IpItemProps) {
  const isAvailable = status === "success" && Boolean(ip);

  return (
    <List.Item
      icon={{
        source: status === "failure" ? Icon.Warning : scope === "Local" ? Icon.Desktop : Icon.Globe,
        tintColor: status === "failure" ? Color.Red : scopeColors[scope],
      }}
      title={isAvailable ? ip : label}
      subtitle={isAvailable ? label : status === "loading" ? "Loading..." : "Unavailable"}
      accessories={[{ tag: { value: scope, color: scopeColors[scope] } }]}
      actions={
        isAvailable ? (
          <ActionPanel>
            <ActionPanel.Section>
              <Action.CopyToClipboard title="Copy Address" content={ip} onCopy={onCopy} />
              {supportsLookup && <Action.Push title="Show Details" target={<IpLookup ip={ip} />} icon={Icon.Eye} />}
            </ActionPanel.Section>
          </ActionPanel>
        ) : undefined
      }
    />
  );
}
