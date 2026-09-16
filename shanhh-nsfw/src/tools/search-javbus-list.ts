import { getHost, searchJavbusText } from "../clients/javbus-client";
import type { JavbusSearchResult } from "../types/javbus-search";
import { parseJavbusSearchResults } from "../utils/javbus-utils";

type Input = {
  /** The content type to search. */
  type?: "有码" | "无码";
  /** A title, identifier, or keyword. */
  searchText: string;
};

/** Search JavBus and return matching titles. */
export default async function searchJavList(input: Input): Promise<JavbusSearchResult[]> {
  const searchText = input.searchText.trim();
  if (!searchText) throw new Error("Search text is required.");

  const html = await searchJavbusText(0, input.type ?? "有码", searchText);
  return parseJavbusSearchResults(html, getHost());
}
