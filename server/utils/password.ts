import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

/**
 * 加密密码
 */
export async function hashUserPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * 验证密码
 */
export async function verifyUserPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
