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
                       accessories={buildAccessories({ result })}
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

function buildAccessories(props: { result: JavbusMagnet }) {
  const accessories: List.Item.Accessory[] = [];

  if (props.result.tags && props.result.tags.length > 0) {
    props.result.tags.forEach((tag) => {
      accessories.push({ text: tag, icon: { source: Icon.Tag, tintColor: tag === "字幕" ? Color.Red : Color.Orange } });
    });
  }

  accessories.push({ text: props.result.size, icon: { source: Icon.Document } });
  accessories.push({ text: props.result.date, icon: { source: Icon.Calendar } });


  return accessories;
}