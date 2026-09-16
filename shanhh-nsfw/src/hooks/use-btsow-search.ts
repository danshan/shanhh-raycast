import { usePromise } from "@raycast/utils";
import { showToast, Toast } from "@raycast/api";
import { getBtsowDetail, getBtsowDetailUrl, searchBtsow } from "../clients/btsow-client";
import { BtsowDetailData, BtsowSearchResult } from "../types/btsow-search";
import { useEffect, useState } from "react";

function formatSize(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + " GB";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
  return bytes + " B";
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

export function useBtsowSearch(searchText: string) {
  return usePromise(
    (searchText: string) => async (options: { page: number }) => {
      try {
        if (!searchText) {
          return { data: [] as BtsowSearchResult[], hasMore: false };
        }

        const items = await searchBtsow(options.page, searchText);
        const list: BtsowSearchResult[] = items.map((item) => ({
          hash: item.hash,
          magnet: "magnet:?xt=urn:btih:" + item.hash,
          title: item.name.replace(/<\/?em>/g, ""),
          size: formatSize(item.size),
          date: formatDate(item.lastUpdateTime),
          link: getBtsowDetailUrl(item.hash),
        }));
        return { data: list, hasMore: list.length >= 50 };
      } catch {
        await showToast(Toast.Style.Failure, "Search Btsow failed");
        return { data: [] as BtsowSearchResult[], hasMore: false };
      }
    },
    [searchText],
  );
}

export function useBtsowDetail(hash: string) {
  const [detail, setDetail] = useState<BtsowDetailData>();
  const [isLoading, setIsLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setFailed(false);
    setDetail(undefined);
    void (async () => {
      try {
        const data = await getBtsowDetail(hash);
        const nextDetail = {
          title: data.name,
          magnet: "magnet:?xt=urn:btih:" + data.hash,
          hash: data.hash,
          size: formatSize(data.size),
          date: formatDate(data.lastUpdateTime),
          fileCount: data.files.length,
          keywords: extractKeywords(data.files.map((f) => f.filename)),
          link: getBtsowDetailUrl(data.hash),
          files: data.files.map((f) => ({
            name: f.filename,
            size: formatSize(f.size),
          })),
        };
        if (active) setDetail(nextDetail);
      } catch {
        if (active) {
          setFailed(true);
          await showToast(Toast.Style.Failure, "Load Btsow detail failed");
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [hash]);

  return { detail, failed, isLoading };
}

const VIDEO_EXTS = new Set([".mkv", ".mp4", ".avi", ".wmv", ".flv", ".mov", ".webm", ".ts", ".m2ts"]);
const AUDIO_EXTS = new Set([".mp3", ".flac", ".wav", ".aac", ".ogg", ".m4a", ".wma"]);
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"]);
const DOC_EXTS = new Set([".pdf", ".epub", ".mobi", ".djvu", ".txt", ".doc", ".docx"]);
const ARCHIVE_EXTS = new Set([".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"]);

function extractKeywords(filenames: string[]): string[] {
  const extensions = new Set<string>();
  for (const name of filenames) {
    const dotIdx = name.lastIndexOf(".");
    if (dotIdx >= 0) {
      const ext = name.slice(dotIdx).toLowerCase();
      extensions.add(ext);
    }
  }
  const categories = new Set<string>();
  for (const ext of extensions) {
    if (VIDEO_EXTS.has(ext)) categories.add("Video");
    else if (AUDIO_EXTS.has(ext)) categories.add("Audio");
    else if (IMAGE_EXTS.has(ext)) categories.add("Image");
    else if (DOC_EXTS.has(ext)) categories.add("Document");
    else if (ARCHIVE_EXTS.has(ext)) categories.add("Archive");
    else categories.add(ext);
  }
  return Array.from(categories);
}
