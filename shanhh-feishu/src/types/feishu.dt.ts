export interface DocSearchItem {
  docs_token: string;
  docs_type: string;
  title: string;
  owner_id: string;
}

export interface DocSearchResult {
  docs_entities: DocSearchItem[];
  has_more: boolean;
  total: number;
}

/**
 * 用于创建飞书的文本消息, 仅支持以文本格式发送.
 * 适合发送简单的文本消息, 如: 你好, 世界!
 * 支持 markdown 语法.
 */
export interface TextMessage {
  msgType: "text";
  content: {
    text: string;
  };
}
