import { getHost, searchJavbusDetail } from "../clients/javbus-client";
import type { JavbusDetailData } from "../types/javbus-search";
import { parseJavbusDetail } from "../utils/javbus-utils";

type Input = {
  /** A detail URL returned by search-javbus-list. */
  url: string;
};

/** Load details for a JavBus search result. */
export default async function getJavbusDetail(input: Input): Promise<JavbusDetailData> {
  const html = await searchJavbusDetail(input.url);
  return parseJavbusDetail(input.url, html, getHost());
}
