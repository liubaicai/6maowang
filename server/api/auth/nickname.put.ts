/**
 * 更新用户昵称接口
 * PUT /api/auth/nickname
 * 
 * 用户可以修改自己的昵称
 */
import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // 验证登录
  const user = await requireAuth(event)
  
  const body = await readBody(event)
  const { nickname } = body
  
  // 更新昵称
  db.update(schema.users)
    .set({ 
      nickname: nickname?.trim() || null,
    })
    .where(eq(schema.users.id, user.id))
    .run()
  
  // 更新 session
  await setUserSession(event, {
    user: {
      ...user,
      nickname: nickname?.trim() || user.username,
    },
  })
  
  return {
    ok: true,
    nickname: nickname?.trim() || null,
  }
})
