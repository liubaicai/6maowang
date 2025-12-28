/**
 * 更新用户信息接口
 * PUT /api/admin/users/:id
 * 
 * 仅管理员可访问
 */
import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/auth'
import { hashUserPassword } from '../../../utils/password'
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
  
  const body = await readBody(event)
  const { nickname, password, role } = body
  
  // 查找用户
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, Number(id)))
    .get()
  
  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }
  
  // 构建更新对象
  const updates: any = {}
  
  if (nickname !== undefined) {
    updates.nickname = nickname?.trim() || null
  }
  
  if (password) {
    if (password.length < 4) {
      throw createError({
        statusCode: 400,
        message: '密码长度至少为 4 个字符',
      })
    }
    updates.passwordHash = await hashUserPassword(password)
  }
  
  if (role && role !== user.role) {
    const newRole = role === 'user' ? 'user' : 'admin'
    updates.role = newRole
  }
  
  // 如果有更新，执行更新
  if (Object.keys(updates).length > 0) {
    db.update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, Number(id)))
      .run()
    
    // 记录操作日志
    logOperation(admin.id, 'update_user', 'user', Number(id), {
      username: user.username,
      updates: Object.keys(updates),
    })
  }
  
  return {
    ok: true,
  }
})
