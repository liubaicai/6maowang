/**
 * 获取用户信息接口
 * GET /api/v1/auth/profile
 * 
 * 请求头:
 * - Authorization: Bearer <token>
 */
import { requireAuth } from '../../../utils/auth'
import { successResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    
    return successResponse({
      id: user.id,
      username: user.username,
    }, '获取成功')
  } catch (error: any) {
    return errorResponse(error.message || '获取失败', error.statusCode === 401 ? 1004 : 1000)
  }
})
