import { db, schema } from './index'
import { eq } from 'drizzle-orm'
import { hashUserPassword } from '../utils/password'

export async function seedDatabase() {
  // 检查是否已有管理员用户
  const existingAdmin = db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, 'admin'))
    .get()

  if (!existingAdmin) {
    const config = useRuntimeConfig()
    const adminPassword = config.adminPassword || 'admin'
    
    // 警告：使用默认密码
    if (adminPassword === 'admin') {
      console.warn('\x1b[33m警告: 使用默认管理员密码 "admin"，请立即修改！\x1b[0m')
    }

    const passwordHash = await hashUserPassword(adminPassword)
    
    db.insert(schema.users).values({
      username: 'admin',
      passwordHash,
      createdAt: new Date().toISOString(),
    }).run()
    
    console.log('✅ 管理员账户已创建: admin')
  }
}
