import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'
import { verifyUserPassword, hashUserPassword } from '../../utils/password'
import { validatePassword } from '../../utils/validators'

export default defineEventHandler(async (event) => {
  // 验证登录状态
  const session = await getUserSession(event)
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }
  
  const body = await readBody(event)
  const { currentPassword, newPassword } = body
  
  // 验证输入
  if (!currentPassword || !newPassword) {
    throw createError({
      statusCode: 400,
      message: '当前密码和新密码不能为空',
    })
  }
  
  // 验证新密码格式
  const validation = validatePassword(newPassword)
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      message: validation.error,
    })
  }
  
  // 获取用户
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .get()
  
  if (!user) {
    throw createError({
      statusCode: 404,
      message: '用户不存在',
    })
  }
  
  // 验证当前密码
  const valid = await verifyUserPassword(currentPassword, user.passwordHash)
  if (!valid) {
    throw createError({
      statusCode: 401,
      message: '当前密码错误',
    })
  }
  
  // 更新密码
  const newHash = await hashUserPassword(newPassword)
  db.update(schema.users)
    .set({ passwordHash: newHash })
    .where(eq(schema.users.id, user.id))
    .run()
  
  return { ok: true, message: '密码已更新' }
})
