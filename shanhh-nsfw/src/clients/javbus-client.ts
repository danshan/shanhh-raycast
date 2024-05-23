import { getPreferenceValues } from "@raycast/api";
import { Preps } from "../types";
import got from "got";


const preps = getPreferenceValues<Preps>();

const host = getHost() + "/search";
const uncensoredHost = getHost() + "/uncensored/search";

export function getHost() {
  return preps.javbusHost;
}

export async function searchJavbus(page: number, type: string, searchText: string) {
  const targetHost = type === "有码" ? host : uncensoredHost;
  const url = `${targetHost}/${searchText}/${page + 1}`;
  console.log("search_url", url);
  const response = await got.get(url, {
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