import { parse } from "node-html-parser";
import { JavbusDetailData, JavbusDetailLabel, JavbusMagnet, JavbusSearchResult } from "../types/javbus-search.dt";
import { getHost } from "../clients/javbus-client";

export function parseJavbusSearchResults(html: string) {
  const doc = parse(html);
  const items = doc.querySelectorAll("#waterfall > .item");
  // items.forEach((item) => {
  // console.log(item.innerHTML);
  // });

  const list: JavbusSearchResult[] = [];
  Array.from(items).forEach((item) => {
    const url = item.querySelector(".movie-box")?.getAttribute("href");
    const thumbnail = getHost() + item.querySelector(".photo-frame > img")?.getAttribute("src");
    const title = item.querySelector(".photo-frame > img")?.getAttribute("title");
    const code = item.querySelector("date")?.text;

    if (!code) {
      return;
    }

    const date = item.querySelectorAll("date")?.[1].text;
    const tags = item.querySelectorAll(".item-tag .btn").map((tag) => tag.text);
    const result: JavbusSearchResult = {
      url: url || "",
      thumbnail: thumbnail || "",
      title: title || "",
      code: code || "",
      date: date || "",
      tags: tags || []
    };
    console.log("result", result);
    list.push(result);
  });
  return list;
}

export function parseJavbusDetail(url: string, html: string) {
  const doc = parse(html);
  const thumbnail = getHost() + doc.querySelector(".bigImage img")?.getAttribute("src");
  const title = doc.querySelector(".bigImage img")?.getAttribute("title");

  const items = doc.querySelectorAll(".info .header");

  // 常规信息收集
  let code = "";
  let date = "";
  let duration = "";
  let director: JavbusDetailLabel = { title: "", url: "" };
  let producer: JavbusDetailLabel = { title: "", url: "" };
  let publisher: JavbusDetailLabel = { title: "", url: "" };
  let series: JavbusDetailLabel = { title: "", url: "" };
  const category: JavbusDetailLabel[] = [];
  items.forEach((item) => {
    const key = item.text;
    if (key === "識別碼:") {
      code = item.nextElementSibling?.text || "";
    } else if (key === "發行日期:") {
      date = item.parentNode.text.trim();
    } else if (key === "長度:") {
      duration = item.parentNode.text.trim();
    } else if (key === "導演:") {
      director = {
        title: item.nextElementSibling?.text || "",
        url: item.nextElementSibling?.getAttribute("href") || ""
      };
    } else if (key === "製作商:") {
      producer = {
        title: item.nextElementSibling?.text || "",
        url: item.nextElementSibling?.getAttribute("href") || ""
      };
    } else if (key === "發行商:") {
      publisher = {
        title: item.nextElementSibling?.text || "",
        url: item.nextElementSibling?.getAttribute("href") || ""
      };
    } else if (key === "系列:") {
      series = {
        title: item.nextElementSibling?.text || "",
        url: item.nextElementSibling?.getAttribute("href") || ""
      };
    } else if (key === "類別:") {
      item.nextElementSibling?.querySelectorAll("a").forEach((tag) =>
        category.push({
          title: tag.text.trim(),
          url: tag.getAttribute("href") || ""
        })
      );
    }
  });

  const actors: JavbusDetailLabel[] = [];
  doc.querySelector(".info .star-show")?.nextElementSibling?.nextElementSibling?.querySelectorAll("a").forEach((item) => {
    actors.push({
      title: item.text.trim(),
      url: item.getAttribute("href") || ""
    });
  });

  const images: string[] = [];
  doc.querySelectorAll("#sample-waterfall .sample-box").forEach((item) => {
    const image = item.getAttribute("href") || "";
    if (image.length > 0) {
      images.push(image);
    }
  });

  const scriptTags = doc.querySelectorAll("script");

  // 用正则表达式提取变量值
  const gidRegex = /var gid = (\d+);/;
  const ucRegex = /var uc = (\d+);/;
  const imgRegex = /var img = '([^']+)';/;

  let gid: string | undefined = undefined;
  let uc: string | undefined = undefined;
  let img: string | undefined = undefined;

  for (const scriptTag of scriptTags) {
    const scriptContent = scriptTag.innerHTML;

    const gidMatch = gidRegex.exec(scriptContent);
    const ucMatch = ucRegex.exec(scriptContent);
    const imgMatch = imgRegex.exec(scriptContent);

    if (gidMatch) gid = gidMatch[1];
    if (ucMatch) uc = ucMatch[1];
    if (imgMatch) img = imgMatch[1];
  }
  const magnetSearchUrl = `${getHost()}/ajax/uncledatoolsbyajax.php?gid=${gid}&lang=zh&img=${img}&uc=${uc}`;

  const result: JavbusDetailData = {
    url: url,
    thumbnail: thumbnail || "",
    title: title || "",
    code: code || "",
    date: date || "",
    magnetSearchUrl: magnetSearchUrl,
    duration: duration || "",
    director: director || "",
    producer: producer || "",
    publisher: publisher || "",
    series: series || "",
    category: category,
    actors: actors,
    images: images
  };
  console.log("detail", result);
  return result;
}

export function parseJavbusMagnets(html: string) {
  const doc = parse(html);
  const items = doc.querySelectorAll("tr");

  const magnets = items.map((item) => {
    console.log("text", item.querySelector("a")?.text.trim() || "");
    console.log("rawText", item.querySelector("a")?.rawText.trim() || "");
    console.log("textContent", item.querySelector("a")?.textContent.trim() || "");
    console.log("innerText", item.querySelector("a")?.innerText.trim() || "");
    console.log("structuredText", item.querySelector("a")?.structuredText.trim() || "");
    const title = item.querySelector("a")?.text.trim() || "";
    const magnet = item.querySelector("a")?.getAttribute("href") || "";
    const size = item.querySelectorAll("td")[1].text.trim() || "";
    const date = item.querySelectorAll("td")[2].text.trim() || "";
    const tags = item.querySelectorAll("a .btn").map((tag) => tag.text.trim());
    const result: JavbusMagnet = {
      title: title,
      magnet: magnet,
      size: size,
      date: date,
      tags: tags
    };
    console.log("magnet", result);
    return result;
  });
  return magnets;
}