import { usePromise } from "@raycast/utils";
import { showToast, Toast } from "@raycast/api";
import { searchJarbusMagnets, searchJavbusText, searchJavbusUrl, searchJavbusDetail } from "../clients/javbus-client";
import { parseJavbusDetail, parseJavbusMagnets, parseJavbusSearchResults } from "../utils/javbus-utils";
import { useEffect, useState } from "react";
import { JavbusDetailData, JavbusMagnet, JavbusSearchResult } from "../types/javbus-search.dt";
import { getHost } from "../clients/javbus-client";
import * as http from "http";

// ---------------------------------------------------------------------------
// Local proxy: rewrites thumbnail URLs to http://127.0.0.1:PORT/...
// Adds the correct Referer header when forwarding to JavBus.
// ---------------------------------------------------------------------------

let proxyServer: http.Server | null = null;
let proxyPort = 0;

async function ensureProxy(): Promise<number> {
  if (proxyServer) return proxyPort;

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const targetUrl = getHost() + (req.url || "/");
      got
        .stream(targetUrl, { headers: { Referer: targetUrl } } as any)
        .on("error", () => {
          res.writeHead(502);
          res.end();
        })
        .pipe(res);
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to bind proxy"));
        return;
      }
      proxyServer = server;
      proxyPort = addr.port;
      console.log("Image proxy started on port", proxyPort);
      resolve(proxyPort);
    });
  });
}

function rewriteUrl(originalUrl: string, port: number): string {
  const host = getHost();
  if (originalUrl.startsWith(host)) {
    const p = originalUrl.slice(host.length);
    return "http://127.0.0.1:" + port + p;
  }
  return originalUrl;
}

async function rewriteThumbnails(results: JavbusSearchResult[]): Promise<JavbusSearchResult[]> {
  const port = await ensureProxy();
  return results.map((r) => ({
    ...r,
    thumbnail: rewriteUrl(r.thumbnail, port),
  }));
}

async function rewriteDetailImages(detail: JavbusDetailData): Promise<JavbusDetailData> {
  const port = await ensureProxy();
  return {
    ...detail,
    thumbnail: rewriteUrl(detail.thumbnail, port),
    images: detail.images.map((img) => rewriteUrl(img, port)),
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

// got is imported inline to avoid top-level streaming issues
import got from "got";

export function useJavbusSearchText(type: string, searchText: string) {
  return usePromise(
    (searchText: string, type: string) => async (options: { page: number }) => {
      try {
        console.log("type", type, "searchText", searchText, "page", options.page);
        if (!searchText) {
          return { data: [] as JavbusSearchResult[], hasMore: false };
        }

        const html = await searchJavbusText(options.page, type, searchText);
        const list = parseJavbusSearchResults(html);
        const data = await rewriteThumbnails(list);
        return { data, hasMore: list.length > 0 };
      } catch (error) {
        console.error(error);
        await showToast(Toast.Style.Failure, "Search Javbus failed");
        return { data: [] as JavbusSearchResult[], hasMore: false };
      }
    },
    [searchText, type],
  );
}

export function useJavbusSearchUrl(url: string) {
  return usePromise(
    (searchText: string) => async (options: { page: number }) => {
      try {
        console.log("url", url, "page", options.page);
        if (!searchText) {
          return { data: [] as JavbusSearchResult[], hasMore: false };
        }

        const html = await searchJavbusUrl(options.page, url);
        const list = parseJavbusSearchResults(html);
        const data = await rewriteThumbnails(list);
        return { data, hasMore: list.length > 0 };
      } catch (error) {
        console.error(error);
        await showToast(Toast.Style.Failure, "Search Javbus failed");
        return { data: [] as JavbusSearchResult[], hasMore: false };
      }
    },
    [url],
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
        const rewritten = await rewriteDetailImages(detail);
        setDetail(rewritten);
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
