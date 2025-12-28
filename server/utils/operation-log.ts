import { db, schema } from '../database'

/**
 * 记录用户操作日志
 * @param userId 用户ID
 * @param action 操作类型
 * @param resourceType 资源类型
 * @param resourceId 资源ID（可选）
 * @param details 操作详情（可选）
 */
export function logOperation(
  userId: number,
  action: string,
  resourceType: string,
  resourceId?: number,
  details?: Record<string, any>
) {
  try {
    db.insert(schema.operationLogs).values({
      userId,
      action,
      resourceType,
      resourceId: resourceId || null,
      details: details ? JSON.stringify(details) : null,
      createdAt: new Date().toISOString(),
    }).run()
  } catch (error) {
    // 记录日志失败不应影响主要操作，仅打印错误
    console.error('操作日志记录失败:', error)
  }
}
