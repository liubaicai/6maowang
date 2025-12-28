/**
 * 获取操作日志接口
 * GET /api/admin/logs
 * 
 * 仅管理员可访问
 */
import { db, schema } from '../../../database'
import { requireAdmin } from '../../../utils/auth'
import { desc, count, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  await requireAdmin(event)
  
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 50))
  const offset = (page - 1) * pageSize
  
  // 获取日志列表，关联用户信息
  const logs = db
    .select({
      id: schema.operationLogs.id,
      userId: schema.operationLogs.userId,
      username: schema.users.username,
      nickname: schema.users.nickname,
      action: schema.operationLogs.action,
      resourceType: schema.operationLogs.resourceType,
      resourceId: schema.operationLogs.resourceId,
      details: schema.operationLogs.details,
      createdAt: schema.operationLogs.createdAt,
    })
    .from(schema.operationLogs)
    .innerJoin(schema.users, eq(schema.operationLogs.userId, schema.users.id))
    .orderBy(desc(schema.operationLogs.createdAt))
    .limit(pageSize)
    .offset(offset)
    .all()
  
  // 获取总数
  const totalResult = db
    .select({ count: count() })
    .from(schema.operationLogs)
    .get()
  const total = totalResult?.count || 0
  
  // 格式化日志
  const formattedLogs = logs.map(log => ({
    ...log,
    displayName: log.nickname || log.username,
    details: log.details ? JSON.parse(log.details) : null,
  }))
  
  return {
    logs: formattedLogs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
})
