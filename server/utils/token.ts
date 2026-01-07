/**
 * Token 认证模块
 * 支持移动端 App 使用 Bearer Token 进行身份验证
 */

import { db, schema } from '../database'
import { eq, and, gt } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'

// Token 有效期（10 年）
const TOKEN_EXPIRES_IN = 10 * 365 * 24 * 60 * 60 * 1000

/**
 * 从请求头获取 Bearer Token
 */
export function getBearerToken(event: any): string | null {
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

/**
 * 生成新的访问令牌
 */
export function generateToken(): string {
  return randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '')
}

/**
 * 创建用户令牌
 */
export function createUserToken(userId: number, deviceInfo?: string): { token: string; expiresAt: string } {
  const token = generateToken()
  const now = new Date()
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRES_IN)
  
  db.insert(schema.tokens).values({
    userId,
    token,
    deviceInfo: deviceInfo || '',
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  }).run()
  
  return {
    token,
    expiresAt: expiresAt.toISOString(),
  }
}

/**
 * 验证令牌并返回用户信息
 */
export function verifyToken(token: string): { id: number; username: string; nickname?: string | null; role: string } | null {
  const now = new Date().toISOString()
  
  const record = db
    .select({
      userId: schema.tokens.userId,
      expiresAt: schema.tokens.expiresAt,
      username: schema.users.username,
      nickname: schema.users.nickname,
      role: schema.users.role,
    })
    .from(schema.tokens)
    .innerJoin(schema.users, eq(schema.tokens.userId, schema.users.id))
    .where(eq(schema.tokens.token, token))
    .get()
  
  if (!record) {
    return null
  }
  
  // 检查是否过期
  if (record.expiresAt < now) {
    // 删除过期令牌
    db.delete(schema.tokens).where(eq(schema.tokens.token, token)).run()
    return null
  }
  
  return {
    id: record.userId,
    username: record.username,
    nickname: record.nickname,
    role: record.role || 'admin',
  }
}

/**
 * 删除用户令牌（登出）
 */
export function revokeToken(token: string): boolean {
  const result = db.delete(schema.tokens).where(eq(schema.tokens.token, token)).run()
  return result.changes > 0
}

/**
 * 删除用户的所有令牌（在其他设备登出）
 */
export function revokeAllUserTokens(userId: number): number {
  const result = db.delete(schema.tokens).where(eq(schema.tokens.userId, userId)).run()
  return result.changes
}

/**
 * 清理过期的令牌
 */
export function cleanupExpiredTokens(): number {
  const now = new Date().toISOString()
  const result = db.delete(schema.tokens).where(gt(now, schema.tokens.expiresAt)).run()
  return result.changes
}

/**
 * 刷新令牌有效期
 */
export function refreshToken(token: string): { expiresAt: string } | null {
  const now = new Date()
  const expiresAt = new Date(now.getTime() + TOKEN_EXPIRES_IN)
  
  const result = db.update(schema.tokens)
    .set({ expiresAt: expiresAt.toISOString() })
    .where(eq(schema.tokens.token, token))
    .run()
  
  if (result.changes === 0) {
    return null
  }
  
  return { expiresAt: expiresAt.toISOString() }
}
