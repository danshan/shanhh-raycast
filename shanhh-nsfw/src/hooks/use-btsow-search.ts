import { usePromise } from "@raycast/utils";
import { showToast, Toast } from "@raycast/api";
import { searchBtsow, searchBtsowDetail } from "../clients/btsow-client";
import { parseBtsowDetail, parseBtsowSearchResults } from "../utils/btso-utils";
import { BtsowDetailData } from "../types/search.dt";
import { useEffect, useState } from "react";

export function useBtsowSearch(searchText: string) {
  return usePromise(
    (searchText: string) => async (options: { page: number }) => {
      try {
        console.log("searchText", searchText, "page", options.page);
        if (!searchText) {
          return { data: [], hasMore: false };
        }

        const html = await searchBtsow(options.page, searchText);
        const list = parseBtsowSearchResults(html);
        return { data: list, hasMore: list.length > 0 };
      } catch (error) {
        console.error(error);
        await showToast(Toast.Style.Failure, "Search Btsow failed");
        return { data: [], hasMore: false };
      }
    }, [searchText]
  );
}

export function useBtsowDetail(url: string) {
  const [detail, setDetail] = useState<BtsowDetailData>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const html = await searchBtsowDetail(url);
        const detail = parseBtsowDetail(html);
        setDetail(detail);
        setIsLoading(false);
      } catch (error) {
        await showToast(Toast.Style.Failure, "Show Btsow detail failed");
      }
    })();
  }, [url]);
  return { detail, isLoading };
}