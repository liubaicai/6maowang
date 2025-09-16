import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'
import { verifyUserPassword } from '../../utils/password'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body
  
  // 验证输入
  if (!username || !password) {
    throw createError({
      statusCode: 400,
      message: '用户名和密码不能为空',
    })
  }
  
  // 查找用户
  const user = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .get()
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误',
    })
  }
  
  // 验证密码
  const valid = await verifyUserPassword(password, user.passwordHash)
  if (!valid) {
    throw createError({
      statusCode: 401,
      message: '用户名或密码错误',
    })
  }
  
  // 设置 Session
  await setUserSession(event, {
    user: {
      id: user.id,
      username: user.username,
    },
  })
  
  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username,
    },
  }
})
