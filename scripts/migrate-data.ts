/**
 * 数据迁移脚本
 * 从旧项目 (d:\Code\6maowang) 迁移数据到新项目
 * 
 * 使用方法: npx tsx scripts/migrate-data.ts
 */

import Database from 'better-sqlite3'
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// 路径配置
const OLD_PROJECT = '/mnt/store/6maowang_bak'
const NEW_PROJECT = process.cwd()

const OLD_DB = join(OLD_PROJECT, 'data', 'app.sqlite')
const NEW_DB = join(NEW_PROJECT, 'data', 'app.sqlite')

// 上传目录现在放在 data 目录下，避免构建时复制
const OLD_UPLOADS = join(OLD_PROJECT, 'public', 'uploads')
const NEW_UPLOADS = join(NEW_PROJECT, 'data', 'uploads')

async function migrate() {
  console.log('🚀 开始数据迁移...\n')
  
  // 检查旧数据库是否存在
  if (!existsSync(OLD_DB)) {
    console.error('❌ 旧数据库不存在:', OLD_DB)
    process.exit(1)
  }
  
  // 确保新目录存在
  mkdirSync(join(NEW_PROJECT, 'data'), { recursive: true })
  mkdirSync(join(NEW_UPLOADS, 'originals'), { recursive: true })
  mkdirSync(join(NEW_UPLOADS, 'thumbs'), { recursive: true })
  
  // 连接数据库
  const oldDb = new Database(OLD_DB, { readonly: true })
  const newDb = new Database(NEW_DB)
  
  // 初始化新数据库
  newDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      cover_photo_id INTEGER,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      album_id INTEGER NOT NULL,
      original_filename TEXT NOT NULL,
      stored_filename TEXT NOT NULL,
      thumbnail_filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      exif_json TEXT,
      shot_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_photos_album ON photos(album_id);
  `)
  
  // 迁移用户
  console.log('📦 迁移用户数据...')
  const users = oldDb.prepare('SELECT * FROM users').all()
  const insertUser = newDb.prepare(
    'INSERT OR REPLACE INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)'
  )
  for (const user of users as any[]) {
    insertUser.run(user.id, user.username, user.password_hash, user.created_at)
  }
  console.log(`  ✅ 迁移了 ${users.length} 个用户\n`)
  
  // 迁移相册
  console.log('📦 迁移相册数据...')
  const albums = oldDb.prepare('SELECT * FROM albums').all()
  const insertAlbum = newDb.prepare(
    'INSERT OR REPLACE INTO albums (id, name, description, cover_photo_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  for (const album of albums as any[]) {
    insertAlbum.run(
      album.id,
      album.name,
      album.description,
      album.cover_photo_id,
      album.created_at,
      album.updated_at
    )
  }
  console.log(`  ✅ 迁移了 ${albums.length} 个相册\n`)
  
  // 迁移照片
  console.log('📦 迁移照片数据...')
  const photos = oldDb.prepare('SELECT * FROM photos').all()
  const insertPhoto = newDb.prepare(
    `INSERT OR REPLACE INTO photos 
     (id, album_id, original_filename, stored_filename, thumbnail_filename, mime_type, width, height, exif_json, shot_at, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  for (const photo of photos as any[]) {
    insertPhoto.run(
      photo.id,
      photo.album_id,
      photo.original_filename,
      photo.stored_filename,
      photo.thumbnail_filename,
      photo.mime_type,
      photo.width,
      photo.height,
      photo.exif_json,
      photo.shot_at,
      photo.created_at,
      photo.updated_at
    )
  }
  console.log(`  ✅ 迁移了 ${photos.length} 张照片\n`)
  
  // 复制图片文件
  console.log('📦 复制图片文件...')
  
  const oldOriginalsDir = join(OLD_UPLOADS, 'originals')
  const oldThumbsDir = join(OLD_UPLOADS, 'thumbs')
  const newOriginalsDir = join(NEW_UPLOADS, 'originals')
  const newThumbsDir = join(NEW_UPLOADS, 'thumbs')
  
  let copiedOriginals = 0
  let copiedThumbs = 0
  
  if (existsSync(oldOriginalsDir)) {
    const files = readdirSync(oldOriginalsDir)
    for (const file of files) {
      const src = join(oldOriginalsDir, file)
      const dest = join(newOriginalsDir, file)
      if (!existsSync(dest)) {
        copyFileSync(src, dest)
        copiedOriginals++
      }
    }
  }
  console.log(`  ✅ 复制了 ${copiedOriginals} 张原图`)
  
  if (existsSync(oldThumbsDir)) {
    const files = readdirSync(oldThumbsDir)
    for (const file of files) {
      const src = join(oldThumbsDir, file)
      const dest = join(newThumbsDir, file)
      if (!existsSync(dest)) {
        copyFileSync(src, dest)
        copiedThumbs++
      }
    }
  }
  console.log(`  ✅ 复制了 ${copiedThumbs} 张缩略图\n`)
  
  // 关闭数据库
  oldDb.close()
  newDb.close()
  
  console.log('🎉 数据迁移完成！')
}

migrate().catch(console.error)
