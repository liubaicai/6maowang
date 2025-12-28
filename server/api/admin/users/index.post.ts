/**
 * 创建用户接口
 * POST /api/admin/users
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
  
  const body = await readBody(event)
  const { username, password, nickname, role } = body
  
  // 验证输入
  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: '用户名和密码不能为空',
    })
  }
  
  if (username.length < 3 || username.length > 20) {
    throw createError({
      statusCode: 400,
      message: '用户名长度必须在 3-20 个字符之间',
    })
  }
  
  if (password.length < 4) {
    throw createError({
      statusCode: 400,
      message: '密码长度至少为 4 个字符',
    })
  }
  
  const userRole = role === 'user' ? 'user' : 'admin'
  
  // 检查用户名是否已存在
  const existingUser = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .get()
  
  if (existingUser) {
    throw createError({
      statusCode: 400,
      message: '用户名已存在',
    })
  }
  
  // 哈希密码
  const passwordHash = await hashUserPassword(password)
  
  // 创建用户
  const result = db.insert(schema.users).values({
    username: username.trim(),
    passwordHash,
    nickname: nickname?.trim() || null,
    role: userRole,
    createdAt: new Date().toISOString(),
  }).run()
  
  // 记录操作日志
  logOperation(admin.id, 'create_user', 'user', Number(result.lastInsertRowid), {
    username: username.trim(),
    role: userRole,
  })
  
  return {
    ok: true,
    id: result.lastInsertRowid,
  }
})
