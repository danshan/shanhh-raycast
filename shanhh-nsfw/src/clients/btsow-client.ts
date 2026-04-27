import got from "got";

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
  console.log("searchBtsow", searchText, "page", page);
  const body = [{ search: searchText }, PAGE_SIZE, page + 1];
  const response = await got.post(BTSOW_API, { json: body });
  const result: BtsowApiResponse = JSON.parse(response.body);
  if (result.code !== 200) {
    throw new Error("Btsow API error: " + result.code);
  }
  return result.data;
}

export async function getBtsowDetail(hash: string) {
  console.log("getBtsowDetail", hash);
  const response = await got.post(BTSOW_MAGNET_API, { json: [hash] });
  const result: BtsowMagnetResponse = JSON.parse(response.body);
  if (result.code !== 200) {
    throw new Error("Btsow magnet API error: " + result.code);
  }
  return result.data;
}
