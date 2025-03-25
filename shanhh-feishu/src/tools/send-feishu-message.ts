import { sendFeishuMessage } from "../clients/feishu-client";
import { CardMessage, TextMessage } from "../types/feishu.dt";

/**
 * 发送飞书消息, 支持文本消息和卡片消息.
 * 文本消息使用 TextMessage 类型, 卡片消息使用 CardMessage 类型.
 */
type Input = {
  receiveIdType: "open_id" | "user_id";
  receiveId: string;
  message: TextMessage | CardMessage;
}

export default async function sendFeishuMessageTool(input: Input) {
  const res = await sendFeishuMessage(input.receiveIdType, input.receiveId, input.message);
  return {
    code: res.code,
    message: res.msg,
    data: res.data,
  }
}
