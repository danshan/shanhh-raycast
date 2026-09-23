import { getPreferenceValues } from "@raycast/api";
import got from "got";
import type { Preferences } from "../types";
import { resolveBtsowUrl } from "../utils/btsow-url";

const PAGE_SIZE = 50;

function getBtsowHost(): string {
  return getPreferenceValues<Preferences>().btsowHost;
}

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
  const apiUrl = resolveBtsowUrl("/bts/data/api/search", getBtsowHost());
  const result = await got.post(apiUrl, { json: body }).json<BtsowApiResponse>();
  if (result.code !== 200) {
    throw new Error("Btsow API error: " + result.code);
  }
  return result.data;
}

export async function getBtsowDetail(hash: string) {
  const apiUrl = resolveBtsowUrl("/bts/data/api/magnet", getBtsowHost());
  const result = await got.post(apiUrl, { json: [hash] }).json<BtsowMagnetResponse>();
  if (result.code !== 200) {
    throw new Error("Btsow magnet API error: " + result.code);
  }
  return result.data;
}

export function getBtsowDetailUrl(hash: string): string {
  return resolveBtsowUrl(`/detail/${encodeURIComponent(hash)}`, getBtsowHost());
}
