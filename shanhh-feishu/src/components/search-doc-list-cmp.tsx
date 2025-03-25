import { List } from "@raycast/api";
import { useState } from "react"
import { useDocList } from "../hooks/use-doc-list";

export function SearchDocListCmp(props: { searchText: string }) {
  const [ searchText, setSearchText ] = useState<string>(props.searchText)
  const { docList, isLoading } = useDocList(searchText);

  console.log("docList", docList);
  
  return (
    <List 
      isLoading={isLoading}
      filtering={false}
      searchText={searchText} 
      onSearchTextChange={setSearchText}
      throttle={true}
      >
      {docList.map((doc) => (
        <List.Item
          key={doc.docs_token}
          title={doc.title}
          subtitle={doc.owner_id}
        />
      ))}
    </List>
  );
}
