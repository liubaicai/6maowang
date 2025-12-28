import { getBearerToken, verifyToken } from './token'

/**
 * 验证用户是否已登录
 * 支持两种认证方式：
 * 1. Session 认证（Web 端）
 * 2. Bearer Token 认证（App 端）
 * 未登录则抛出 401 错误
 */
export async function requireAuth(event: any) {
  // 优先检查 Bearer Token（App 端）
  const token = getBearerToken(event)
  if (token) {
    const user = verifyToken(token)
    if (user) {
      return user
    }
    throw createError({
      statusCode: 401,
      message: '令牌无效或已过期',
    })
  }
  
  // 检查 Session（Web 端）
  const session = await getUserSession(event)
  
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }
  
  return session.user
}

/**
 * 验证用户是否为管理员
 * 如果不是管理员则抛出 403 错误
 */
export async function requireAdmin(event: any) {
  const user = await requireAuth(event)
  
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '权限不足，仅管理员可访问',
    })
  }
  
  return user
}

/**
 * 获取当前用户（可选认证）
 * 如果未登录返回 null，不抛出错误
 */
export async function getOptionalAuth(event: any) {
  // 优先检查 Bearer Token
  const token = getBearerToken(event)
  if (token) {
    return verifyToken(token)
  }
  
  // 检查 Session
  const session = await getUserSession(event)
  return session?.user || null
}
