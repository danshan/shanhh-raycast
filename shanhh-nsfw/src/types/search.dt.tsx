export interface BtsowSearchResult {
  magnet: string;
  url: string;
  title: string;
  size: string;
  date: string;
}

export interface DetailState {
  isLoading: boolean;
  error?: string;
  datas?: BtsowDetailData;
}

export interface BtsowDetailData {
  title: string;
  magnet: string;
  hash: string;
  count: string;
  size: string;
  date: string;
  keywords: string[];
  link: string;
  files: BtsowDetailFile[];
}

export interface BtsowDetailFile {
  name: string;
  size: string;
  type: string[];
}
