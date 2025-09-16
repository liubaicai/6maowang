import { initDatabase } from '../database'
import { seedDatabase } from '../database/seed'
import { ensureUploadDirs } from '../utils/paths'

export default defineNitroPlugin(async () => {
  console.log('🚀 初始化数据库...')
  
  // 确保上传目录存在
  ensureUploadDirs()
  
  // 初始化数据库表
  initDatabase()
  
  // 初始化种子数据
  await seedDatabase()
  
  console.log('✅ 数据库初始化完成')
})
