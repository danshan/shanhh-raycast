/**
 * JAV 影片搜索结果
 */
export interface JavbusSearchResult {
  /**
   * 影片的详情页 URL
   */
  url: string;
  /**
   * 影片的番号
   */
  code: string;
  /**
   * 影片的封面图片
   */
  thumbnail: string;
  /**
   * 影片的标题
   */
  title: string;
  /**
   * 影片的日期
   */
  date: string;
  /**
   * 影片的标签
   */
  tags: string[];
}

/**
 * 影片详情页数据
 */
export interface JavbusDetailData {
  /**
   * 影片的详情页 URL
   */
  url: string;
  /**
   * 影片的封面图片
   */
  thumbnail: string;
  /**
   * 影片的标题
   */
  title: string;
  /**
   * 影片的番号
   */
  code: string;
  /**
   * 影片的日期
   */
  date: string;
  /**
   * 影片的时长
   */
  duration: string;
  /**
   * 影片的导演
   */
  director: JavbusDetailLabel;
  /**
   * 影片的制作公司
   */
  producer: JavbusDetailLabel;
  /**
   * 影片的发行公司
   */
  publisher: JavbusDetailLabel;
  /**
   * 影片的系列
   */
  series: JavbusDetailLabel;
  /**
   * 影片的分类
   */
  category: JavbusDetailLabel[];
  /**
   * 影片的演员
   */
  actors: JavbusDetailLabel[];
  /**
   * 影片的图片
   */
  images: string[];
  /**
   * 磁力链接搜索 URL
   */
  magnetSearchUrl: string;
}

/**
 * 影片详情页中的标签
 */
export interface JavbusDetailLabel {
  /**
   * 标签的名称
   */
  title: string;
  /**
   * 标签的 URL
   */
  url: string;
}

/**
 * 磁力链接
 */
export interface JavbusMagnet {
  /**
   * 磁力链接的标题
   */
  title: string;
  /**
   * 磁力链接
   */
  magnet: string;
  /**
   * 磁力链接的大小
   */
  size: string;
  /**
   * 磁力链接的日期
   */
  date: string;
  /**
   * 磁力链接的标签
   */
  tags: string[];
}
