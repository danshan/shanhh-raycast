import { getContact } from "../clients/feishu-client";

type Input = {
  /**
   * userId 类型, 支持 open_id 和 user_id.
   * @remarks open_id 是飞书用户的 open_id, 仅用于飞书的内部.
   * @remarkds user_id 是域账号, 用于飞书以外的系统.
   * @example ["open_id", "user_id"]
   */
  userIdType: "open_id" | "user_id";
  /**
   * 指定查询结果中的部门 ID 类型
   * @remarks open_department_id 是飞书部门的 open_id, 仅用于飞书的内部.
   * @remarkds department_id 是部门 id, 用于飞书以外的系统.
   * @example ["open_department_id", "department_id"]
   */
  departmentIdType: "open_department_id" | "department_id";

  /**
   * userId 的值, 根据 userIdType 类型而定.
   * @remarks 当 userIdType 为 open_id 时, userId 为飞书用户的 open_id, 用于飞书的内部系统. eg: ou_7dab8a3d3d066781e97008a16cf1527c
   * @remarks 当 userIdType 为 user_id 时, userId 为域账号, 如 honghao.shan, xianglong.peng, 用于飞书的外部系统.
   * @example ["honghao.shan", "xianglong.peng", "ou_7dab8a3d3d066781e97008a16cf1527c"]
   */
  userId: string;
};

/**
 * 调用该接口获取通讯录中某一用户的信息，包括用户 ID、名称、邮箱、手机号、状态以及所属部门等信息。
 * 返回的data中, 包含用户信息, 字段相关信息如下:
 * - user_id: 用户的域账号.
 * - open_id: 用户在飞书应用中的 id
 * - name: 用户名
 * - en_name: 用户英文名
 * - nickname: 用户昵称
 * - email: 邮箱
 * - mobile: 手机号
 * - mobile_visible: 手机号可见性
 * - status: 用户状态
 * - avatar: 用户头像
 * - leader_user_id: 用户直属领导 ID, ID 值的类型与查询参数 user_id_type 的取值保持一致
 * - employee_type: 员工类型, 可选值 1：正式员工; 2：实习生; 3：外包; 4：劳务; 5：顾问
 * - department_ids: 用户所属部门的 ID 列表，一个用户可属于多个部门。ID 值的类型与查询参数 department_id_type 的取值保持一致。
 */
export default async function getFeishuContactTool(input: Input) {
  const res = await getContact(input.userIdType, input.userId, input.departmentIdType);
  return {
    code: res.code,
    message: res.msg,
    data: res.data,
  };
}
