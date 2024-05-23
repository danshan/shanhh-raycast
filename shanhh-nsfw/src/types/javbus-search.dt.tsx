export interface JavbusSearchResult {
  url: string;
  thumbnail: string;
  title: string;
  code: string;
  date: string;
  tags: string[];
}

export interface JavbusDetailData {
  url: string;
  thumbnail: string;
  title: string;
  code: string;
  date: string;
  duration: string;
  director: string;
  producer: string;
  publisher: string;
  category: string[];
  actors: string[];
  images: string[];
  magnetSearchUrl: string;
}

export interface JavbusMagnet {
  title: string;
  magnet: string;
  size: string;
  date: string;
  tags: string[];
}
