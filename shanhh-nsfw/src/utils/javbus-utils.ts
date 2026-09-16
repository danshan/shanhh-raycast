import { parse } from "node-html-parser";
import type { JavbusDetailData, JavbusDetailLabel, JavbusMagnet, JavbusSearchResult } from "../types/javbus-search";

export function parseJavbusSearchResults(html: string, baseUrl: string): JavbusSearchResult[] {
  const results: JavbusSearchResult[] = [];

  for (const item of parse(html).querySelectorAll("#waterfall > .item")) {
    const code = item.querySelector("date")?.text.trim();
    const url = resolveUrl(item.querySelector(".movie-box")?.getAttribute("href"), baseUrl);
    if (!code || !url) continue;

    results.push({
      url,
      thumbnail: resolveUrl(item.querySelector(".photo-frame > img")?.getAttribute("src"), baseUrl),
      title: item.querySelector(".photo-frame > img")?.getAttribute("title") || "",
      code,
      date: item.querySelectorAll("date")[1]?.text.trim() || "",
      tags: item.querySelectorAll(".item-tag .btn").map((tag) => tag.text.trim()),
    });
  }

  return results;
}

export function parseJavbusDetail(url: string, html: string, baseUrl: string): JavbusDetailData {
  const doc = parse(html);
  const image = doc.querySelector(".bigImage img");
  let code = "";
  let date = "";
  let duration = "";
  let director = emptyLabel();
  let producer = emptyLabel();
  let publisher = emptyLabel();
  let series = emptyLabel();
  const category: JavbusDetailLabel[] = [];

  for (const item of doc.querySelectorAll(".info .header")) {
    const key = item.text.trim();
    if (key === "識別碼:") code = item.nextElementSibling?.text.trim() || "";
    else if (key === "發行日期:") date = valueAfterHeader(item.parentNode.text, key);
    else if (key === "長度:") duration = valueAfterHeader(item.parentNode.text, key);
    else if (key === "導演:") director = parseLabel(item.nextElementSibling, baseUrl);
    else if (key === "製作商:") producer = parseLabel(item.nextElementSibling, baseUrl);
    else if (key === "發行商:") publisher = parseLabel(item.nextElementSibling, baseUrl);
    else if (key === "系列:") series = parseLabel(item.nextElementSibling, baseUrl);
    else if (key === "類別:") {
      for (const tag of item.nextElementSibling?.querySelectorAll("a") || []) {
        category.push({ title: tag.text.trim(), url: resolveUrl(tag.getAttribute("href"), baseUrl) });
      }
    }
  }

  const actors: JavbusDetailLabel[] = [];
  const actorLinks = doc.querySelector(".info .star-show")?.nextElementSibling?.nextElementSibling?.querySelectorAll("a");
  for (const actor of actorLinks || []) {
    actors.push({ title: actor.text.trim(), url: resolveUrl(actor.getAttribute("href"), baseUrl) });
  }

  const images = doc
    .querySelectorAll("#sample-waterfall .sample-box")
    .map((item) => resolveUrl(item.getAttribute("href"), baseUrl))
    .filter(Boolean);

  let gid: string | undefined;
  let uc: string | undefined;
  let magnetImage: string | undefined;
  for (const script of doc.querySelectorAll("script")) {
    gid ||= /var gid = (\d+);/.exec(script.innerHTML)?.[1];
    uc ||= /var uc = (\d+);/.exec(script.innerHTML)?.[1];
    magnetImage ||= /var img = '([^']+)';/.exec(script.innerHTML)?.[1];
  }

  return {
    url,
    thumbnail: resolveUrl(image?.getAttribute("src"), baseUrl),
    title: image?.getAttribute("title") || "",
    code,
    date,
    magnetSearchUrl: buildMagnetSearchUrl(baseUrl, gid, uc, magnetImage),
    duration,
    director,
    producer,
    publisher,
    series,
    category,
    actors,
    images,
  };
}

export function parseJavbusMagnets(html: string): JavbusMagnet[] {
  const magnets: JavbusMagnet[] = [];

  for (const row of parse(html).querySelectorAll("tr")) {
    const link = row.querySelectorAll("a").find((item) => item.getAttribute("href")?.startsWith("magnet:"));
    const magnet = link?.getAttribute("href");
    if (!link || !magnet) continue;

    const columns = row.querySelectorAll("td");
    magnets.push({
      title: link.text.trim(),
      magnet,
      size: columns[1]?.text.trim() || "",
      date: columns[2]?.text.trim() || "",
      tags: row.querySelectorAll(".btn").map((tag) => tag.text.trim()),
    });
  }

  return magnets;
}

function resolveUrl(value: string | undefined, baseUrl: string): string {
  if (!value) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function emptyLabel(): JavbusDetailLabel {
  return { title: "", url: "" };
}

function parseLabel(element: { text: string; getAttribute(name: string): string | undefined } | null, baseUrl: string) {
  if (!element) return emptyLabel();
  return { title: element.text.trim(), url: resolveUrl(element.getAttribute("href"), baseUrl) };
}

function valueAfterHeader(value: string, header: string): string {
  return value.replace(header, "").trim();
}

function buildMagnetSearchUrl(baseUrl: string, gid: string | undefined, uc: string | undefined, image: string | undefined): string {
  if (!gid || !uc || !image) return "";
  const url = new URL("/ajax/uncledatoolsbyajax.php", baseUrl);
  url.search = new URLSearchParams({ gid, lang: "zh", img: image, uc }).toString();
  return url.toString();
}
