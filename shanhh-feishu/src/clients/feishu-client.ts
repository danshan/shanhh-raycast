import * as lark from '@larksuiteoapi/node-sdk';
import { Preps } from '../types/common.dt';
import { getPreferenceValues } from '@raycast/api';
import { getUserToken } from '../utils/token';
import { CardMessage, DocSearchResult, TextMessage } from '../types/feishu.dt';

const preps = getPreferenceValues<Preps>();


const client = new lark.Client({
  appId: preps.feishuAppId,
  appSecret: preps.feishuAppSecret
})

export async function searchDocList(searchText: string) : Promise<DocSearchResult> {
  const userToken = getUserToken();
  console.log("userToken", userToken);
  if (!userToken) {
    throw new Error("user token is empty");
  }
  const res = await client.request({
    method: 'POST',
    url: 'https://open.feishu.cn/open-apis/suite/docs-api/search/object',
    data: {
        search_key: searchText, // 搜索关键词
        count: 1,         // 返回的文件数量
        offset: 0,         // 偏移量
        docs_types: ["docx"], // 文件类型
    },
    headers: {
        Authorization: `Bearer user_access_token`, // 用户访问凭证
    },
  });
  console.log(res.data);
  return res.data;
}

export async function sendFeishuMessage(receiveIdType: "open_id" | "user_id", receiveId: string, message: TextMessage) {
  const res = await client.im.message.create({
    params: {
      receive_id_type: receiveIdType,
    },
    data: {
      receive_id: receiveId,
      msg_type: message.msgType,
      content: JSON.stringify(message.content),
    },
  });
  return res;
}

export async function getContact(userIdType: "open_id" | "user_id", userId: string, departmentIdType: "open_department_id" | "department_id") {
  const res = await client.contact.v3.user.get({
    params: {
      user_id_type: userIdType,
      department_id_type: departmentIdType,
    },
    path: {
      user_id: userId,
    },
  });
  return res;
}

export async function getDepartment(departmentIdType: "open_department_id" | "department_id", departmentId: string, userIdType: "open_id" | "user_id") {
  const res = await client.contact.v3.department.get({
    params: {
      department_id_type: departmentIdType,
      user_id_type: userIdType,
    },
    path: {
      department_id: departmentId,
    },
  });
  return res;
}