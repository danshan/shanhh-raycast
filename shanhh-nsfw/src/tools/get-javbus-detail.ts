import { searchJavbusDetail } from "../clients/javbus-client";
import { JavbusDetailData } from "../types/javbus-search.dt";
import { parseJavbusDetail } from "../utils/javbus-utils";

type Input = {
    /**
     * 影片的详情页 url
     */
    url: string;
}

/**
 * 根据影片详情页 url 获取影片详情, 返回影片详细数据
 * 
 * 返回值格式中: 
 * url 是详情页的 url
 * thumbnail 是影片的封面图片
 * title 是影片的标题
 * code 是影片的番号
 * date 是影片的日期
 * tags 是影片的标签
 * actors 是影片的演员
 * producer 是影片的制作公司
 * publisher 是影片的发行公司
 * series 是影片的系列
 * category 是影片的分类
 * images 是影片的图片
 * magnetSearchUrl 是磁力链接的搜索页 url
 * 
 * @param input 搜索参数
 * @returns 影片详情页数据
 */
export default async function searchJavDetail(input: Input): Promise<JavbusDetailData> {
    const html = await searchJavbusDetail(input.url);
    const detail = parseJavbusDetail(input.url, html);
    return detail;
}