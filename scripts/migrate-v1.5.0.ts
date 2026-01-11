/**
 * 数据库迁移脚本 v1.5.0
 * 
 * 迁移内容：
 * - 添加 is_public 字段到 albums 表（控制相册是否公开）
 * - 默认所有现有相册都公开（is_public = 1）
 * 
 * 运行方式：npx tsx scripts/migrate-v1.5.0.ts
 */

import Database from 'better-sqlite3'
import { join } from 'node:path'

const dbPath = join(process.cwd(), 'data', 'app.sqlite')
const sqlite = new Database(dbPath)

console.log('=== 数据库迁移 v1.5.0 ===\n')
console.log('添加 is_public 字段到 albums 表...\n')

try {
  // 检查字段是否已存在
  const tableInfo = sqlite.prepare('PRAGMA table_info(albums)').all() as Array<{ name: string }>
  const hasIsPublicColumn = tableInfo.some(col => col.name === 'is_public')

  if (hasIsPublicColumn) {
    console.log('✓ is_public 字段已存在，跳过迁移\n')
  } else {
    // 添加 is_public 字段，默认值为 1（公开）
    sqlite.exec(`
      ALTER TABLE albums ADD COLUMN is_public INTEGER NOT NULL DEFAULT 1;
    `)
    console.log('✓ 成功添加 is_public 字段（默认公开）\n')
  }

  // 统计相册数量
  const totalAlbums = sqlite.prepare('SELECT COUNT(*) as count FROM albums').get() as { count: number }
  const publicAlbums = sqlite.prepare('SELECT COUNT(*) as count FROM albums WHERE is_public = 1').get() as { count: number }
  const privateAlbums = sqlite.prepare('SELECT COUNT(*) as count FROM albums WHERE is_public = 0').get() as { count: number }

  console.log('相册统计:')
  console.log(`  总相册数: ${totalAlbums.count}`)
  console.log(`  公开相册: ${publicAlbums.count}`)
  console.log(`  私有相册: ${privateAlbums.count}`)
  console.log('\n=== 迁移完成 ===')
} catch (error) {
  console.error('迁移失败:', error)
  process.exit(1)
} finally {
  sqlite.close()
}
