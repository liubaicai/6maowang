/**
 * 删除用户接口
 * DELETE /api/admin/users/:id
 * 
 * 仅管理员可访问
 */
import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/auth'
import { logOperation } from '../../../utils/operation-log'

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  const admin = await requireAdmin(event)
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '用户 ID 不能为空',
    })
  }

  const userId = Number(id)

  // 不能删除自己
  if (userId === admin.id) {
    throw createError({
      statusCode: 400,
      message: '不能删除当前登录的用户',
    })
  }
  
  // 查找用户
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .get()
  
  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }

  // 删除用户（由于外键级联删除，相关的 tokens 和 operationLogs 也会被删除）
  db.delete(schema.users)
    .where(eq(schema.users.id, userId))
    .run()
  
  // 记录操作日志
  logOperation(admin.id, 'delete_user', 'user', userId, {
    username: user.username,
    role: user.role,
  })
  
  return {
    ok: true,
  }
})
