import { getPreferenceValues } from "@raycast/api";
import { Preps } from "../types";
import got from "got";


const preps = getPreferenceValues<Preps>();

const host = getHost() + "/search";
const uncensoredHost = getHost() + "/uncensored/search";

export function getHost() {
  return preps.javbusHost;
}

export async function searchJavbusText(page: number, type: string, searchText: string) {
  const targetHost = type === "有码" ? host : uncensoredHost;
  const url = `${targetHost}/${searchText}`;
  return searchJavbusUrl(page, url);
}

export async function searchJavbusUrl(page: number, url: string) {
  const javbusUrl = `${url}/${page + 1}`;
  console.log("search_url", javbusUrl);
  // header: -H 'cookie: age=verified; dv=1'
  const response = await got.get(javbusUrl, {
    // skip age validation
    followRedirect: false
  });
  return response.body;
}

export async function searchJavbusDetail(url: string) {
  console.log("detail_url", url);
  const response = await got.get(url, {
    // skip age validation
    followRedirect: false
  });
  return response.body;
}

export async function searchJarbusMagnets(url: string, referer: string) {
  console.log("detail_url", url, "referer", referer);
  const response = await got.get(url, {
    followRedirect: false,
    headers: {
      "referer": referer
    }
  });
  return response.body;
}