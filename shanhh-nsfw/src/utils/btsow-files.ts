import type { BtsowDetailFile } from "../types/btsow-search";

const VIDEO_EXTS = new Set([".mkv", ".mp4", ".avi", ".wmv", ".flv", ".mov", ".webm", ".ts", ".m2ts"]);
const AUDIO_EXTS = new Set([".mp3", ".flac", ".wav", ".aac", ".ogg", ".m4a", ".wma"]);
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"]);
const DOC_EXTS = new Set([".pdf", ".epub", ".mobi", ".djvu", ".txt", ".doc", ".docx"]);
const ARCHIVE_EXTS = new Set([".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"]);

const PRIORITY_CATEGORIES = ["Video", "Image", "Archive"] as const;

export interface BtsowFileSection {
  category: string;
  files: BtsowDetailFile[];
}

export interface BtsowFileGroups {
  priority: BtsowFileSection[];
  other: BtsowDetailFile[];
}

function getFileCategory(name: string): string | undefined {
  const dotIndex = name.lastIndexOf(".");
  if (dotIndex < 0) return undefined;

  const extension = name.slice(dotIndex).toLowerCase();
  if (VIDEO_EXTS.has(extension)) return "Video";
  if (AUDIO_EXTS.has(extension)) return "Audio";
  if (IMAGE_EXTS.has(extension)) return "Image";
  if (DOC_EXTS.has(extension)) return "Document";
  if (ARCHIVE_EXTS.has(extension)) return "Archive";
  return extension;
}

export function extractBtsowFileCategories(filenames: string[]): string[] {
  return Array.from(new Set(filenames.map(getFileCategory).filter((category): category is string => Boolean(category))));
}

export function groupBtsowFiles(files: BtsowDetailFile[]): BtsowFileGroups {
  const priority = new Map<string, BtsowDetailFile[]>(PRIORITY_CATEGORIES.map((category) => [category, []]));
  const other: BtsowDetailFile[] = [];

  for (const file of files) {
    const category = getFileCategory(file.name);
    const categoryFiles = category ? priority.get(category) : undefined;
    if (categoryFiles) categoryFiles.push(file);
    else other.push(file);
  }

  return {
    priority: PRIORITY_CATEGORIES.flatMap((category) => {
      const categoryFiles = priority.get(category) ?? [];
      return categoryFiles.length > 0 ? [{ category, files: categoryFiles }] : [];
    }),
    other,
  };
}
