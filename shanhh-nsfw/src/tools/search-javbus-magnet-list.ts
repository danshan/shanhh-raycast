import { searchJavbusMagnets } from "../clients/javbus-client";
import type { JavbusMagnet } from "../types/javbus-search";
import { parseJavbusMagnets } from "../utils/javbus-utils";

type Input = {
  /** A detail URL returned by search-javbus-list. */
  detailUrl: string;
  /** A magnet search URL returned by get-javbus-detail. */
  magnetSearchUrl: string;
};

/** Load magnet links using URLs returned by prior JavBus tools. */
export default async function searchJavbusMagnetList(input: Input): Promise<JavbusMagnet[]> {
  const html = await searchJavbusMagnets(input.magnetSearchUrl, input.detailUrl);
  return parseJavbusMagnets(html);
}
