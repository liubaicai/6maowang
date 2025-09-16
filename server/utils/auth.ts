/**
 * 验证用户是否已登录
 * 未登录则抛出 401 错误
 */
export async function requireAuth(event: any) {
  const session = await getUserSession(event)
  
  if (!session?.user) {
    throw createError({
      statusCode: 401,
      message: '请先登录',
    })
  }
  
  return session.user
}
