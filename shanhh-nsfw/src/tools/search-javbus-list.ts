import { searchJavbusText } from "../clients/javbus-client";
import { JavbusSearchResult } from "../types/javbus-search.dt";
import { parseJavbusSearchResults } from "../utils/javbus-utils";

type Input = {
    /**
     * 影片类型, 仅支持 "有码" 和 "无码"
     * 
     * 有码: 有码影片
     * 无码: 无码影片
     * @example "有码" or "无码"
     */
    type?: "有码" | "无码";
    /**
     * 影片的番号, 或关键词 
     * 
     * 番号: 如 "SSNI-001"
     * 关键词: 如 "彼女"
     */
    searchText: string;
}

/**
 * jav 或 javbus, 是同一个网站的名称, 该网站的内容是日本成人影片, 所以该工具也称为 JAV 搜索工具.
 * 搜索 JAV 影片列表, 返回搜索结果列表, 支持通过番号或关键词搜索, 根据输入的类型, 返回有码或无码影片列表.
 * 返回的列表中, 每个元素是一个 JavbusSearchResult 对象, 包含影片的详情页 url、番号、封面图片、标题、日期、标签等信息.
 * 如果需要更进一步获取影片的详情, 需要遍历列表, 获取每个元素的详情页 url, 然后调用 get-javbus-detail 工具获取详情.
 * 
 * @param input 搜索参数
 * @returns 搜索结果
 */
export default async function searchJavList(input: Input): Promise<JavbusSearchResult[]> {
    if (!input.type) {
        input.type = "有码";
    }
    const html = await searchJavbusText(0, input.type, input.searchText);
    const list = parseJavbusSearchResults(html);
    return list;
}