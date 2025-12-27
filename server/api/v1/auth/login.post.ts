/**
 * App 登录接口
 * POST /api/v1/auth/login
 * 
 * 请求体:
 * - username: 用户名
 * - password: 密码
 * - deviceInfo: 设备信息（可选）
 * 
 * 返回 access token 用于后续请求认证
 */
import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { verifyUserPassword } from '../../../utils/password'
import { createUserToken } from '../../../utils/token'
import { successResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { username, password, deviceInfo } = body
    
    // 验证输入
    if (!username || !password) {
      return errorResponse('用户名和密码不能为空', 1001)
    }
    
    // 查找用户
    const user = db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, username))
      .get()
    
    if (!user) {
      return errorResponse('用户名或密码错误', 1002)
    }
    
    // 验证密码
    const valid = await verifyUserPassword(password, user.passwordHash)
    if (!valid) {
      return errorResponse('用户名或密码错误', 1002)
    }
    
    // 创建令牌
    const { token, expiresAt } = createUserToken(user.id, deviceInfo)
    
    return successResponse({
      token,
      expiresAt,
      user: {
        id: user.id,
        username: user.username,
      },
    }, '登录成功')
  } catch (error: any) {
    return errorResponse(error.message || '登录失败', 1000)
  }
})
