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
  }
}

/**
 * 用于创建飞书的卡片消息, 支持以卡片格式发送. 
 * 适合发送复杂的卡片消息, 如: 一个包含标题, 描述, 按钮的卡片.
 */
export interface CardMessage {
  msgType: "interactive";
  content: {
    card: any;
  }
}
