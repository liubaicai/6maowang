/**
 * 数据库迁移脚本 v1.1.0
 * 
 * 迁移内容：
 * - users 表：添加 nickname, role 列
 * - albums 表：添加 created_by 列
 * - photos 表：添加 created_by, deleted_at 列
 * 
 * 运行方式：npx tsx scripts/migrate-v1.1.0.ts
 */

import Database from 'better-sqlite3'
import { join } from 'node:path'

const dbPath = join(process.cwd(), 'data', 'app.sqlite')
const sqlite = new Database(dbPath)

console.log('=== 数据库迁移 v1.1.0 ===\n')
console.log('检查 users 表结构...')

// 获取 users 表信息
const usersTableInfo = sqlite.prepare("PRAGMA table_info(users)").all() as { name: string }[]
const usersColumns = usersTableInfo.map(col => col.name)

console.log('users 现有列:', usersColumns.join(', '))

if (!usersColumns.includes('nickname')) {
  console.log('添加 nickname 列...')
  sqlite.exec('ALTER TABLE users ADD COLUMN nickname TEXT')
  console.log('✓ nickname 列已添加')
} else {
  console.log('✓ nickname 列已存在')
}

if (!usersColumns.includes('role')) {
  console.log('添加 role 列...')
  sqlite.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin'")
  console.log('✓ role 列已添加')
} else {
  console.log('✓ role 列已存在')
}

console.log('\n检查 albums 表结构...')

// 获取 albums 表信息
const albumsTableInfo = sqlite.prepare("PRAGMA table_info(albums)").all() as { name: string }[]
const albumsColumns = albumsTableInfo.map(col => col.name)

console.log('albums 现有列:', albumsColumns.join(', '))

if (!albumsColumns.includes('created_by')) {
  console.log('添加 created_by 列...')
  sqlite.exec('ALTER TABLE albums ADD COLUMN created_by INTEGER')
  console.log('✓ created_by 列已添加')
} else {
  console.log('✓ created_by 列已存在')
}

console.log('\n检查 photos 表结构...')

// 获取 photos 表信息
const photosTableInfo = sqlite.prepare("PRAGMA table_info(photos)").all() as { name: string }[]
const photosColumns = photosTableInfo.map(col => col.name)

console.log('photos 现有列:', photosColumns.join(', '))

if (!photosColumns.includes('created_by')) {
  console.log('添加 created_by 列...')
  sqlite.exec('ALTER TABLE photos ADD COLUMN created_by INTEGER')
  console.log('✓ created_by 列已添加')
} else {
  console.log('✓ created_by 列已存在')
}

if (!photosColumns.includes('deleted_at')) {
  console.log('添加 deleted_at 列...')
  sqlite.exec('ALTER TABLE photos ADD COLUMN deleted_at TEXT')
  console.log('✓ deleted_at 列已添加')
} else {
  console.log('✓ deleted_at 列已存在')
}

sqlite.close()
console.log('\n数据库迁移完成！')
