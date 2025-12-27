/**
 * App 登出接口
 * POST /api/v1/auth/logout
 * 
 * 请求头:
 * - Authorization: Bearer <token>
 * 
 * 撤销当前 token
 */
import { getBearerToken, revokeToken } from '../../../utils/token'
import { successResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    const token = getBearerToken(event)
    
    if (!token) {
      return errorResponse('缺少认证令牌', 1003)
    }
    
    revokeToken(token)
    
    return successResponse(null, '登出成功')
  } catch (error: any) {
    return errorResponse(error.message || '登出失败', 1000)
  }
})
