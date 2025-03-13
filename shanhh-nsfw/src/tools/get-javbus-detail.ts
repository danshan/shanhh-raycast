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
 * 根据影片详情页 url 获取影片详情, 返回影片详情页数据, 包含影片的详情页 url、封面图片、标题、番号、日期、标签, 演员, 磁力连接, 文件信息, 等.
 * 
 * @param input 搜索参数
 * @returns 影片详情页数据
 */
export default async function searchJavDetail(input: Input): Promise<JavbusDetailData> {
    const html = await searchJavbusDetail(input.url);
    const detail = parseJavbusDetail(input.url, html);
    return detail;
}