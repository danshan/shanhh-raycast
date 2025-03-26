import { useEffect, useState } from "react";
import { searchDocList } from "../clients/feishu-client";
import { DocSearchItem } from "../types/feishu.dt";

export function useDocList(searchText: string) {
  const [docList, setDocList] = useState<DocSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  console.log("searchText", searchText);

  useEffect(() => {
    (async () => {
      const result = await searchDocList(searchText);
      console.log("search result", result);
      setDocList(result?.docs_entities || []);
      setIsLoading(false);
    })();
  }, [searchText]);

  return { docList, isLoading };
}
