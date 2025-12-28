/**
 * 获取用户列表接口
 * GET /api/admin/users
 * 
 * 仅管理员可访问
 */
import { db, schema } from '../../../database'
import { requireAdmin } from '../../../utils/auth'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  await requireAdmin(event)
  
  // 获取用户列表
  const users = db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      nickname: schema.users.nickname,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .all()
  
  return users
})
