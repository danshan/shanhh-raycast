import { getPreferenceValues } from "@raycast/api";
import got from "got";
import type { Preferences } from "../types";

const BTSOW_API = "https://btsow.pics/bts/data/api/search";
const BTSOW_MAGNET_API = "https://btsow.pics/bts/data/api/magnet";
const PAGE_SIZE = 50;

interface BtsowApiResponse {
  code: number;
  data: BtsowApiItem[];
}

interface BtsowMagnetResponse {
  code: number;
  data: BtsowMagnetData;
}

export interface BtsowApiItem {
  hash: string;
  name: string;
  size: number;
  lastUpdateTime: number;
}

export interface BtsowMagnetData {
  hash: string;
  name: string;
  size: number;
  date: number;
  lastUpdateTime: number;
  files: BtsowMagnetFile[];
}

export interface BtsowMagnetFile {
  filename: string;
  size: number;
}

export async function searchBtsow(page: number, searchText: string) {
  const body = [{ search: searchText }, PAGE_SIZE, page + 1];
  const result = await got.post(BTSOW_API, { json: body }).json<BtsowApiResponse>();
  if (result.code !== 200) {
    throw new Error("Btsow API error: " + result.code);
  }
  return result.data;
}

export async function getBtsowDetail(hash: string) {
  const result = await got.post(BTSOW_MAGNET_API, { json: [hash] }).json<BtsowMagnetResponse>();
  if (result.code !== 200) {
    throw new Error("Btsow magnet API error: " + result.code);
  }
  return result.data;
}

export function getBtsowDetailUrl(hash: string): string {
  const url = new URL(getPreferenceValues<Preferences>().btsowHost);
  if (url.protocol !== "https:") {
    throw new Error("Btsow host must use HTTPS.");
  }
  url.pathname = `/detail/${encodeURIComponent(hash)}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}
