import { usePromise } from "@raycast/utils";
import { showToast, Toast } from "@raycast/api";
import { searchJarbusMagnets, searchJavbus, searchJavbusDetail } from "../clients/javbus-client";
import { parseJavbusDetail, parseJavbusMagnets, parseJavbusSearchResults } from "../utils/javbus-utils";
import { useEffect, useState } from "react";
import { JavbusDetailData, JavbusMagnet } from "../types/javbus-search.dt";

export function useJavbusSearch(type: string, searchText: string) {
  return usePromise(
    (searchText: string) => async (options: { page: number }) => {
      try {
        console.log("type", type, "searchText", searchText, "page", options.page);
        if (!searchText) {
          return { data: [], hasMore: false };
        }

        const html = await searchJavbus(options.page, type, searchText);
        const list = parseJavbusSearchResults(html);
        return { data: list, hasMore: list.length > 0 };
      } catch (error) {
        console.error(error);
        await showToast(Toast.Style.Failure, "Search Javbus failed");
        return { data: [], hasMore: false };
      }
    }, [searchText]
  );
}


export function useJavbusDetail(url: string) {
  const [detail, setDetail] = useState<JavbusDetailData>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const html = await searchJavbusDetail(url);
        const detail = parseJavbusDetail(url, html);
        setDetail(detail);
        setIsLoading(false);
      } catch (error) {
        await showToast(Toast.Style.Failure, "Show Javbus detail failed");
      }
    })();
  }, [url]);
  return { detail, isLoading };
}

export function useJarbusMagnets(url: string, referer: string) {
  const [magnets, setMagnets] = useState<JavbusMagnet[]>();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        if (!url || !referer) {
          setMagnets([]);
          setIsLoading(false);
          return;
        }
        const html = await searchJarbusMagnets(url, referer);
        const magnets = parseJavbusMagnets(html);
        setMagnets(magnets);
        setIsLoading(false);
      } catch (error) {
        await showToast(Toast.Style.Failure, "Show Javbus magnets failed");
      }
    })();
  }, [url]);
  return { magnets, isLoading };
}