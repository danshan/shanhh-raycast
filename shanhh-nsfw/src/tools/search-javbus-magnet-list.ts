import { searchJarbusMagnets, searchJavbusDetail } from "../clients/javbus-client";
import { JavbusDetailData, JavbusMagnet } from "../types/javbus-search.dt";
import { parseJavbusDetail, parseJavbusMagnets } from "../utils/javbus-utils";

type Input = {
    /**
     * 影片的详情页 url
     */
    detailUrl: string;
    /**
     * 磁力链接的搜索页 url
     */
    magnetSearchUrl: string;
}

/**
 * 根据影片磁力链接的搜索页 url 以及 详情页 url 获取影片磁力链接, 返回磁力链接列表.
 * 
 * @param input 搜索参数
 * @returns 磁力链接列表
 */
export default async function searchJavMagnetList(input: Input): Promise<JavbusMagnet[]> {
    const html = await searchJarbusMagnets(input.detailUrl, input.magnetSearchUrl);
    const magnets = parseJavbusMagnets(html);
    return magnets;
}