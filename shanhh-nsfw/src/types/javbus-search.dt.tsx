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
  director: JavbusDetailLabel;
  producer: JavbusDetailLabel;
  publisher: JavbusDetailLabel;
  series: JavbusDetailLabel;
  category: JavbusDetailLabel[];
  actors: JavbusDetailLabel[];
  images: string[];
  magnetSearchUrl: string;
}

export interface JavbusDetailLabel {
  title: string;
  url: string;
}

export interface JavbusMagnet {
  title: string;
  magnet: string;
  size: string;
  date: string;
  tags: string[];
}
