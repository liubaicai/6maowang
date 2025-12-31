/**
 * 数据库迁移脚本 v1.4.0
 * 
 * 迁移内容：
 * - 添加 is_slideshow 字段到 photos 表（控制照片是否参与轮播）
 * - 默认所有现有照片都参与轮播
 * 
 * 运行方式：npx tsx scripts/migrate-v1.4.0.ts
 */

import Database from 'better-sqlite3'
import { join } from 'node:path'

const dbPath = join(process.cwd(), 'data', 'app.sqlite')
const sqlite = new Database(dbPath)

console.log('=== 数据库迁移 v1.4.0 ===\n')
console.log('添加 is_slideshow 字段到 photos 表...\n')

try {
  // 检查字段是否已存在
  const tableInfo = sqlite.prepare('PRAGMA table_info(photos)').all() as Array<{ name: string }>
  const hasIsSlideshowColumn = tableInfo.some(col => col.name === 'is_slideshow')

  if (hasIsSlideshowColumn) {
    console.log('✓ is_slideshow 字段已存在，跳过迁移\n')
  } else {
    // 添加 is_slideshow 字段，默认值为 0（不参与轮播）
    sqlite.exec(`
      ALTER TABLE photos ADD COLUMN is_slideshow INTEGER NOT NULL DEFAULT 0;
    `)
    console.log('✓ 成功添加 is_slideshow 字段（默认不参与轮播）\n')
  }

  // 统计照片数量
  const totalPhotos = sqlite.prepare('SELECT COUNT(*) as count FROM photos').get() as { count: number }
  const slideshowPhotos = sqlite.prepare('SELECT COUNT(*) as count FROM photos WHERE is_slideshow = 1').get() as { count: number }
  const deletedPhotos = sqlite.prepare('SELECT COUNT(*) as count FROM photos WHERE deleted_at IS NOT NULL').get() as { count: number }

  console.log('照片统计:')
  console.log(`  总照片数: ${totalPhotos.count}`)
  console.log(`  参与轮播: ${slideshowPhotos.count}`)
  console.log(`  已删除: ${deletedPhotos.count}`)
  console.log('\n=== 迁移完成 ===')
} catch (error) {
  console.error('迁移失败:', error)
  process.exit(1)
} finally {
  sqlite.close()
}
