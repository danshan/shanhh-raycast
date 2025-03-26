import { Tool } from "@raycast/api";
import { sendFeishuMessage } from "../clients/feishu-client";
import { TextMessage } from "../types/feishu.dt";

type Input = {
  /**
   * 接收者类型, 支持 open_id 和 user_id.
   * @remarks open_id 是飞书用户的 open_id, 用于飞书的内部系统.
   * @remarkds user_id 是域账号, 用于飞书的外部系统.
   * @example ["open_id", "user_id"]
   */
  receiveIdType: "open_id" | "user_id";
  /**
   * 接收者 id, 根据 receiveIdType 类型而定.
   * @remarks 当 receiveIdType 为 open_id 时, 接收者 id 为飞书用户的 open_id, 用于飞书的内部系统. eg: ou_7dab8a3d3d066781e97008a16cf1527c
   * @remarks 当 receiveIdType 为 user_id 时, 接收者 id 为域账号, 如 honghao.shan, xianglong.peng, 用于飞书的外部系统.
   * @example ["honghao.shan", "xianglong.peng", "ou_7dab8a3d3d066781e97008a16cf1527c"]
   */
  receiveId: string;

  /**
   * 消息内容, 支持文本消息和卡片消息, 对应 msgType 为 text.
   * 文本内容支持 markdown 语法.
   * @example ["你好, 世界!"]
   */
  text?: string;
};

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  return {
    message: `确认给 ${input.receiveId} 发送消息?`,
    info: [{ name: "内容", value: input.text }],
  };
};

/**
 * 发送飞书消息, 支持文本消息.
 * 文本内容支持 markdown 语法.
 * 需要根据 receiveId 类型判断是 open_id 还是 user_id.
 */
export default async function sendFeishuMessageTool(input: Input) {
  const message = { content: { text: input.text } } as TextMessage;
  console.log("message", message);
  const res = await sendFeishuMessage(input.receiveIdType, input.receiveId, message);
  return {
    code: res.code,
    message: res.msg,
    data: res.data,
  };
}
