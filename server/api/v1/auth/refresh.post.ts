/**
 * 刷新令牌接口
 * POST /api/v1/auth/refresh
 * 
 * 请求头:
 * - Authorization: Bearer <token>
 * 
 * 延长当前 token 的有效期
 */
import { getBearerToken, refreshToken, verifyToken } from '../../../utils/token'
import { successResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    const token = getBearerToken(event)
    
    if (!token) {
      return errorResponse('缺少认证令牌', 1003)
    }
    
    // 验证令牌
    const user = verifyToken(token)
    if (!user) {
      return errorResponse('令牌无效或已过期', 1004)
    }
    
    // 刷新令牌
    const result = refreshToken(token)
    if (!result) {
      return errorResponse('刷新令牌失败', 1005)
    }
    
    return successResponse({
      token,
      expiresAt: result.expiresAt,
      user,
    }, '令牌刷新成功')
  } catch (error: any) {
    return errorResponse(error.message || '刷新失败', 1000)
  }
})
