export interface BtsowSearchResult {
  magnet: string;
  hash: string;
  title: string;
  size: string;
  date: string;
}

export interface BtsowDetailData {
  title: string;
  magnet: string;
  hash: string;
  size: string;
  date: string;
  fileCount: number;
  keywords: string[];
  link: string;
  files: BtsowDetailFile[];
}

export interface BtsowDetailFile {
  name: string;
  size: string;
}
