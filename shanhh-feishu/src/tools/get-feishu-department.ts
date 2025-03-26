import { getDepartment } from "../clients/feishu-client";

type Input = {
  /**
   * 指定查询结果中的用户 ID 类型
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
   * 部门 ID，ID 类型需要与查询参数 department_id_type 的取值保持一致。
   * @remarks 当 departmentIdType 为 open_department_id 时, departmentId 为飞书部门的 open_id, 用于飞书的内部系统. eg: od-e211b35658c5094a1b17c49ea6d534d4
   * @remarks 当 departmentIdType 为 department_id 时, departmentId 为部门 id, 如 SUPERVISORY_ORGANIZATION-3-12596, 用于飞书的外部系统.
   * @example ["SUPERVISORY_ORGANIZATION-3-12596", "od-e211b35658c5094a1b17c49ea6d534d4"]
   */
  departmentId: string;
};

/**
 * 调用该接口获取单个部门信息，包括部门名称、ID、父部门、负责人、状态以及成员个数等
 * 返回的data中, 包含用户信息, 字段相关信息如下:
 * - name: 部门名称
 * - parent_department_id: 父部门 ID
 * - department_id: 自定义部门 ID。后续可以使用该 ID 删除、修改、查询部门信息
 * - open_department_id: 飞书系统中的部门的 open_department_id
 * - leader_user_id: 部门主管的用户 ID，ID 类型与查询参数的 user_id_type 取值保持一致
 * - member_count: 部门成员个数
 * - leaders: 部门主管列表
 *   - leaderType: 主管类型, 可选值有： 1：主负责人, 2：副负责人
 *   - leaderID: 负责人的用户 ID，ID 类型与查询参数的 user_id_type 取值保持一致。
 * - primary_member_count: 当前部门及其下属部门的主属成员（即成员的主部门为当前部门）的数量
 */
export default async function getFeishuDepartmentTool(input: Input) {
  const res = await getDepartment(input.departmentIdType, input.departmentId, input.userIdType);
  return {
    code: res.code,
    message: res.msg,
    data: res.data,
  };
}
