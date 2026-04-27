import { Action, ActionPanel, Icon, List, useNavigation } from "@raycast/api";
import got from "got";
import { useEffect, useState } from "react";
import LookUp from "./my-ip-detail";
import { address } from "ip";

export type LoadingStatus = "loading" | "success" | "failure";

export function MyIpList() {
  const [globalStatus, setGlobalStatus] = useState<LoadingStatus>("loading");
  const [chineseStatus, setChineseStatus] = useState<LoadingStatus>("loading");
  const [globalIp, setGlobalIp] = useState("");
  const [chineseIp, setChineseIp] = useState("");
  const { pop } = useNavigation();
  const [localIp] = useState(() => address("public", "ipv4").toString());

  useEffect(() => {
    async function getGlobalIp() {
      try {
        const data = (await got.get("https://api64.ipify.org")).body;
        console.log(data);
        setGlobalIp(data);
        setGlobalStatus("success");
      } catch (error) {
        setGlobalIp("Failure");
        setGlobalStatus("failure");
      }
    }

    async function getChineseIp() {
      try {
        const data = (await got.get("https://myip.ipip.net")).body;
        console.log(data);
        let groups = /\d+\.\d+\.\d+\.\d+/.exec(data);
        setChineseIp(groups ? groups[0] : "");
        setChineseStatus("success");
      } catch (error) {
        setChineseIp("Failure");
        setChineseStatus("failure");
      }
    }

    getGlobalIp();
    getChineseIp();
  }, []);

  return (
    <List isLoading={globalStatus === "loading"}>
      <List.Item
        icon={Icon.Desktop}
        title={localIp}
        actions={
          !!localIp && (
            <ActionPanel>
              <Action.CopyToClipboard
                content={localIp}
                onCopy={() => {
                  pop();
                }}
              />
            </ActionPanel>
          )
        }
        accessories={[
          {
            text: "Local IP address"
          }
        ]}
      />
      <List.Item
        subtitle={chineseIp === "" ? "Loading..." : ""}
        icon={Icon.Globe}
        title={chineseIp}
        actions={
          chineseStatus === "success" && (
            <ActionPanel>
              <Action.CopyToClipboard
                content={chineseIp}
                onCopy={() => {
                  pop();
                }}
              />
            </ActionPanel>
          )
        }
        accessories={[
          {
            text: "Public Chinese IP address"
          }
        ]}
      />
      {chineseStatus === "success" && (
        <>
          <List.Item
            icon={chineseIp === "" ? "" : Icon.Eye}
            title=""
            subtitle="Chinese IP Lookup"
            actions={
              <ActionPanel>
                <Action.Push title="Chinese IP Lookup" target={<LookUp ip={chineseIp} />} icon={Icon.Eye} />
              </ActionPanel>
            }
            accessories={[
              {
                text: "Details of the public Chinese IP address"
              }
            ]}
          />
        </>
      )}
      <List.Item
        subtitle={globalIp === "" ? "Loading..." : ""}
        icon={Icon.Globe}
        title={globalIp}
        actions={
          globalStatus === "success" && (
            <ActionPanel>
              <Action.CopyToClipboard
                content={globalIp}
                onCopy={() => {
                  pop();
                }}
              />
            </ActionPanel>
          )
        }
        accessories={[
          {
            text: "Public Global IP address"
          }
        ]}
      />
      {globalStatus === "success" && (
        <>
          <List.Item
            icon={globalIp === "" ? "" : Icon.Eye}
            title=""
            subtitle="Global IP Lookup"
            actions={
              <ActionPanel>
                <Action.Push title="Global IP Lookup" target={<LookUp ip={globalIp} />} icon={Icon.Eye} />
              </ActionPanel>
            }
            accessories={[
              {
                text: "Details of the public Global IP address"
              }
            ]}
          />
        </>
      )}

    </List>
  );
}
