import { showToast, Toast } from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useEffect, useState } from "react";
import { getHost, rewriteJavbusDetailImages, rewriteJavbusSearchImages, searchJavbusDetail, searchJavbusMagnets, searchJavbusText, searchJavbusUrl } from "../clients/javbus-client";
import type { JavbusDetailData, JavbusMagnet, JavbusSearchResult } from "../types/javbus-search";
import { parseJavbusDetail, parseJavbusMagnets, parseJavbusSearchResults } from "../utils/javbus-utils";

export function useJavbusSearchText(type: "有码" | "无码", searchText: string) {
  return usePromise(
    (currentSearchText: string, currentType: "有码" | "无码") => async (options: { page: number }) => {
      try {
        if (!currentSearchText) {
          return { data: [] as JavbusSearchResult[], hasMore: false };
        }

        const html = await searchJavbusText(options.page, currentType, currentSearchText);
        const list = parseJavbusSearchResults(html, getHost());
        return { data: await rewriteJavbusSearchImages(list), hasMore: list.length > 0 };
      } catch {
        await showToast(Toast.Style.Failure, "Search JavBus failed");
        return { data: [] as JavbusSearchResult[], hasMore: false };
      }
    },
    [searchText, type],
  );
}

export function useJavbusSearchUrl(url: string) {
  return usePromise(
    (currentUrl: string) => async (options: { page: number }) => {
      try {
        if (!currentUrl) {
          return { data: [] as JavbusSearchResult[], hasMore: false };
        }

        const html = await searchJavbusUrl(options.page, currentUrl);
        const list = parseJavbusSearchResults(html, getHost());
        return { data: await rewriteJavbusSearchImages(list), hasMore: list.length > 0 };
      } catch {
        await showToast(Toast.Style.Failure, "Search JavBus failed");
        return { data: [] as JavbusSearchResult[], hasMore: false };
      }
    },
    [url],
  );
}

export function useJavbusDetail(url: string) {
  const [detail, setDetail] = useState<JavbusDetailData>();
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setFailed(false);
    setDetail(undefined);
    void (async () => {
      try {
        const html = await searchJavbusDetail(url);
        const parsed = parseJavbusDetail(url, html, getHost());
        const nextDetail = await rewriteJavbusDetailImages(parsed);
        if (active) setDetail(nextDetail);
      } catch {
        if (active) {
          setFailed(true);
          await showToast(Toast.Style.Failure, "Show JavBus detail failed");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [url]);

  return { detail, failed, isLoading };
}

export function useJavbusMagnets(url: string, referer: string) {
  const [magnets, setMagnets] = useState<JavbusMagnet[]>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    void (async () => {
      try {
        if (!url || !referer) {
          setMagnets([]);
          return;
        }
        const html = await searchJavbusMagnets(url, referer);
        setMagnets(parseJavbusMagnets(html));
      } catch {
        await showToast(Toast.Style.Failure, "Show JavBus magnets failed");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [referer, url]);

  return { magnets, isLoading };
}
