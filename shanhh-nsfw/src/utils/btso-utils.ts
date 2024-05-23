import { parse } from "node-html-parser";
import { BtsowDetailData, BtsowDetailFile, BtsowSearchResult } from "../types/btsow-search.dt";

export function parseBtsowSearchResults(html: string) {
  const doc = parse(html);
  const items = doc.querySelectorAll(".data-list .row:not(.hidden-xs)");
  items.forEach((item) => {
    console.log(item.innerHTML);
  });
  const list = Array.from(items).map((item) => {
    const title = item.querySelector("a")?.getAttribute("title");
    const magnet = item.querySelector("a")?.getAttribute("href")?.split("/").pop();
    const url = "https:" + item.querySelector("a")?.getAttribute("href");
    const size = item.querySelector(".size")?.textContent;
    const date = item.querySelector(".date")?.textContent;
    const result: BtsowSearchResult = {
      title: title || "",
      url: url || "",
      magnet: magnet || "",
      size: size || "",
      date: date || ""
    };
    console.log("result", result);
    return result;
  });
  return list;
}

export function parseBtsowDetail(html: string) {
  const doc = parse(html);
  const title = doc.querySelector("h3")?.textContent;
  const magnet = doc.querySelector("#magnetLink")?.textContent;
  const hash = doc.querySelector(".data-list .row .value")?.textContent;
  const count = doc.querySelector(".data-list .row:nth-child(2) .value")?.textContent;
  const size = doc.querySelector(".data-list .row:nth-child(3) .value")?.textContent;
  const date = doc.querySelector(".data-list .row:nth-child(4) .value")?.textContent;
  const keywords = Array.from(doc.querySelectorAll(".data-list .row:nth-child(5) .value a")).map((item) => item.textContent);
  const link = "https:" + doc.querySelector(".data-list .hidden-xs .value");
  const files = doc.querySelectorAll("div.container > :nth-child(12) .row:not(.row:first-child)").map((item) => {
    const name = item.querySelector(".file")?.textContent;
    const size = item.querySelector(".size")?.textContent;
    const type = item.querySelector("span")?.getAttribute("class")?.split(" ");
    const file: BtsowDetailFile = {
      name: name || "",
      size: size || "",
      type: type || []
    };
    return file;
  });

  const result: BtsowDetailData = {
    title: title || "",
    magnet: magnet || "",
    size: size || "",
    date: date || "",
    count: count || "",
    hash: hash || "",
    keywords: keywords || [],
    link: link || "",
    files: files || []
  };
  console.log("detail", result);
  return result;
}