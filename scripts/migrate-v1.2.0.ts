/**
 * 数据库迁移脚本 v1.2.0
 * 
 * 迁移内容：
 * - photos 表：添加 s3_original_url, s3_thumbnail_url, s3_uploaded_at 列
 * - 创建 system_settings 表（用于存储 S3 配置等系统设置）
 * - 将已有的 S3 完整 URL 转换为相对路径
 * 
 * 运行方式：npx tsx scripts/migrate-v1.2.0.ts
 */

import Database from 'better-sqlite3'
import { join } from 'node:path'

const dbPath = join(process.cwd(), 'data', 'app.sqlite')
const sqlite = new Database(dbPath)

console.log('=== 数据库迁移 v1.2.0 ===\n')

// 1. 检查 photos 表结构
console.log('检查 photos 表结构...')

const photosTableInfo = sqlite.prepare("PRAGMA table_info(photos)").all() as { name: string }[]
const photosColumns = photosTableInfo.map(col => col.name)

console.log('photos 现有列:', photosColumns.join(', '))

if (!photosColumns.includes('s3_original_url')) {
  console.log('添加 s3_original_url 列...')
  sqlite.exec('ALTER TABLE photos ADD COLUMN s3_original_url TEXT')
  console.log('✓ s3_original_url 列已添加')
} else {
  console.log('✓ s3_original_url 列已存在')
}

if (!photosColumns.includes('s3_thumbnail_url')) {
  console.log('添加 s3_thumbnail_url 列...')
  sqlite.exec('ALTER TABLE photos ADD COLUMN s3_thumbnail_url TEXT')
  console.log('✓ s3_thumbnail_url 列已添加')
} else {
  console.log('✓ s3_thumbnail_url 列已存在')
}

if (!photosColumns.includes('s3_uploaded_at')) {
  console.log('添加 s3_uploaded_at 列...')
  sqlite.exec('ALTER TABLE photos ADD COLUMN s3_uploaded_at TEXT')
  console.log('✓ s3_uploaded_at 列已添加')
} else {
  console.log('✓ s3_uploaded_at 列已存在')
}

// 2. 创建 system_settings 表
console.log('\n检查 system_settings 表...')

const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='system_settings'").all()

if (tables.length === 0) {
  console.log('创建 system_settings 表...')
  sqlite.exec(`
    CREATE TABLE system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at TEXT NOT NULL
    )
  `)
  console.log('✓ system_settings 表已创建')
} else {
  console.log('✓ system_settings 表已存在')
}

// 3. 迁移 S3 URL 从完整路径到相对路径
console.log('\n检查 S3 URL 迁移...')

const photosWithFullUrl = sqlite.prepare(`
  SELECT COUNT(*) as count FROM photos 
  WHERE s3_original_url LIKE 'http://%' OR s3_original_url LIKE 'https://%'
`).get() as { count: number }

if (photosWithFullUrl.count > 0) {
  console.log(`发现 ${photosWithFullUrl.count} 条完整 URL，开始迁移为相对路径...`)
  
  // 提取相对路径（从 URL 中提取 originals/ 或 thumbs/ 开始的部分）
  sqlite.exec(`
    UPDATE photos 
    SET s3_original_url = SUBSTR(s3_original_url, INSTR(s3_original_url, 'originals/'))
    WHERE s3_original_url LIKE '%/originals/%' 
      AND (s3_original_url LIKE 'http://%' OR s3_original_url LIKE 'https://%')
  `)
  
  sqlite.exec(`
    UPDATE photos 
    SET s3_thumbnail_url = SUBSTR(s3_thumbnail_url, INSTR(s3_thumbnail_url, 'thumbs/'))
    WHERE s3_thumbnail_url LIKE '%/thumbs/%' 
      AND (s3_thumbnail_url LIKE 'http://%' OR s3_thumbnail_url LIKE 'https://%')
  `)
  
  console.log('✓ S3 URL 迁移完成')
} else {
  console.log('✓ 无需迁移（没有完整 URL 或已迁移）')
}

// 4. 显示 S3 统计
console.log('\n=== S3 统计信息 ===')

const s3Stats = sqlite.prepare(`
  SELECT 
    COUNT(*) as total,
    COUNT(s3_original_url) as synced
  FROM photos
  WHERE deleted_at IS NULL
`).get() as { total: number; synced: number }

console.log(`总照片数: ${s3Stats.total}`)
console.log(`已同步到 S3: ${s3Stats.synced}`)
console.log(`未同步: ${s3Stats.total - s3Stats.synced}`)

sqlite.close()
console.log('\n数据库迁移完成！')
