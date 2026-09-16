import { getPreferenceValues } from "@raycast/api";
import got from "got";
import * as http from "http";
import type { Preferences } from "../types";
import type { JavbusDetailData, JavbusSearchResult } from "../types/javbus-search";
import { resolveJavbusRequestUrl } from "../utils/javbus-url";

let proxyServer: http.Server | undefined;
let proxyPort = 0;
let proxyStart: Promise<number> | undefined;

export function getHost(): string {
  const url = new URL(getPreferenceValues<Preferences>().javbusHost);
  if (url.protocol !== "https:") {
    throw new Error("JavBus host must use HTTPS.");
  }
  return url.origin;
}

export async function searchJavbusText(page: number, type: "有码" | "无码", searchText: string): Promise<string> {
  const prefix = type === "有码" ? "/search/" : "/uncensored/search/";
  const url = new URL(prefix + encodeURIComponent(searchText.trim()), getHost());
  return searchJavbusUrl(page, url.toString());
}

export async function searchJavbusUrl(page: number, value: string): Promise<string> {
  const url = new URL(resolveJavbusRequestUrl(value, getHost()));
  url.pathname = `${url.pathname.replace(/\/$/, "")}/${page + 1}`;
  return got.get(url, { followRedirect: false }).text();
}

export async function searchJavbusDetail(value: string): Promise<string> {
  const url = resolveJavbusRequestUrl(value, getHost());
  return got.get(url, { followRedirect: false }).text();
}

export async function searchJavbusMagnets(value: string, referer: string): Promise<string> {
  const url = resolveJavbusRequestUrl(value, getHost());
  const safeReferer = resolveJavbusRequestUrl(referer, getHost());
  return got.get(url, { followRedirect: false, headers: { referer: safeReferer } }).text();
}

export async function rewriteJavbusSearchImages(results: JavbusSearchResult[]): Promise<JavbusSearchResult[]> {
  const port = await ensureProxy();
  return results.map((result) => ({ ...result, thumbnail: rewriteImageUrl(result.thumbnail, port) }));
}

export async function rewriteJavbusDetailImages(detail: JavbusDetailData): Promise<JavbusDetailData> {
  const port = await ensureProxy();
  return {
    ...detail,
    thumbnail: rewriteImageUrl(detail.thumbnail, port),
    images: detail.images.map((image) => rewriteImageUrl(image, port)),
  };
}

async function ensureProxy(): Promise<number> {
  if (proxyServer) return proxyPort;
  if (proxyStart) return proxyStart;

  proxyStart = new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      let targetUrl: string;
      try {
        targetUrl = resolveJavbusRequestUrl(request.url || "/", getHost());
      } catch {
        response.writeHead(400);
        response.end();
        return;
      }

      got
        .stream(targetUrl, { followRedirect: false, headers: { referer: getHost() } })
        .on("error", () => {
          response.writeHead(502);
          response.end();
        })
        .pipe(response);
    });

    server.once("error", (error) => {
      proxyStart = undefined;
      reject(error);
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        proxyStart = undefined;
        reject(new Error("Failed to bind image proxy."));
        return;
      }
      proxyServer = server;
      proxyPort = address.port;
      resolve(proxyPort);
    });
  });

  return proxyStart;
}

function rewriteImageUrl(value: string, port: number): string {
  if (!value) return value;

  const url = new URL(value);
  if (url.origin !== getHost()) return value;
  return `http://127.0.0.1:${port}${url.pathname}${url.search}`;
}
