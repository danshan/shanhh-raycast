import React from "react";
import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useJarbusMagnets } from "../hooks/use-javbus-search";
import { JavbusDetailData, JavbusMagnet } from "../types/javbus-search.dt";


export function JavbusMagnetList(props: { detail?: JavbusDetailData }) {
  const { magnets, isLoading } = useJarbusMagnets(props?.detail?.magnetSearchUrl || "", props?.detail?.url || "");

  return (
    <List
      isLoading={isLoading}
      filtering={false}
      navigationTitle={props.detail?.title || "Search Magnets"}
      throttle
    >
      {
        (magnets || []).length == 0 ? (
            <List.EmptyView
              title="No results"
              description="Try another search term"
            />
          ) :
          (magnets || []).map((result: JavbusMagnet) => (
            <List.Item key={result.magnet} title={result.title} icon={{ source: Icon.Link, tintColor: Color.Blue }}
                       accessories={[
                         { text: result.size, icon: { source: Icon.Document } },
                         { text: result.date, icon: { source: Icon.Calendar } }]}
                       actions={
                         <ActionPanel>
                           <Action.CopyToClipboard title="Copy Magnet" content={result.magnet} />
                         </ActionPanel>
                       } />
          ))
      }
    </List>
  );
}
