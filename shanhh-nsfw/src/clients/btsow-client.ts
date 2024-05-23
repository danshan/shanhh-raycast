import got from "got";
import { getPreferenceValues } from "@raycast/api";
import { Preps } from "../types";


const preps = getPreferenceValues<Preps>();

export async function searchBtsow(page: number, searchText: string) {
  const url = `${preps.btsowHost}/search/${searchText}/page/${page + 1}`;
  console.log("search_url", url);
  const response = await got.get(url);
  return response.body;
}

export async function searchBtsowDetail(url: string) {
  console.log("detail_url", url);
  const response = await got.get(url);
  return response.body;
}

