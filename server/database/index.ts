import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'
import * as schema from './schema'

// 确保数据目录存在
const dataDir = join(process.cwd(), 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

// 创建数据库连接
const dbPath = join(dataDir, 'app.sqlite')
const sqlite = new Database(dbPath)

// 启用 WAL 模式和 UTF-8 编码
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('encoding = "UTF-8"')

// 创建 Drizzle 实例
export const db = drizzle(sqlite, { schema })

// 导出 schema
export { schema }

// 初始化数据库表
export function initDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      cover_photo_id INTEGER,
      created_by INTEGER,
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
      created_by INTEGER,
      deleted_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      device_info TEXT DEFAULT '',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id INTEGER,
      details TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_photos_album ON photos(album_id);
    CREATE INDEX IF NOT EXISTS idx_photos_deleted ON photos(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_tokens_user ON tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_tokens_token ON tokens(token);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_user ON operation_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_operation_logs_created ON operation_logs(created_at);
  `)
  
  // 执行数据迁移，为现有数据库添加新列
  migrateDatabase()
}

// 数据库迁移函数
function migrateDatabase() {
  try {
    // 检查并添加 users 表的新列
    const usersColumns = sqlite.pragma('table_info(users)')
    const hasNickname = usersColumns.some((col: any) => col.name === 'nickname')
    const hasRole = usersColumns.some((col: any) => col.name === 'role')
    
    if (!hasNickname) {
      console.log('正在迁移: 添加 users.nickname 列...')
      sqlite.exec('ALTER TABLE users ADD COLUMN nickname TEXT')
    }
    
    if (!hasRole) {
      console.log('正在迁移: 添加 users.role 列...')
      sqlite.exec('ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT "admin"')
    }
    
    // 检查并添加 albums 表的新列
    const albumsColumns = sqlite.pragma('table_info(albums)')
    const hasAlbumCreatedBy = albumsColumns.some((col: any) => col.name === 'created_by')
    
    if (!hasAlbumCreatedBy) {
      console.log('正在迁移: 添加 albums.created_by 列...')
      sqlite.exec('ALTER TABLE albums ADD COLUMN created_by INTEGER')
    }
    
    // 检查并添加 photos 表的新列
    const photosColumns = sqlite.pragma('table_info(photos)')
    const hasPhotoCreatedBy = photosColumns.some((col: any) => col.name === 'created_by')
    const hasDeletedAt = photosColumns.some((col: any) => col.name === 'deleted_at')
    
    if (!hasPhotoCreatedBy) {
      console.log('正在迁移: 添加 photos.created_by 列...')
      sqlite.exec('ALTER TABLE photos ADD COLUMN created_by INTEGER')
    }
    
    if (!hasDeletedAt) {
      console.log('正在迁移: 添加 photos.deleted_at 列...')
      sqlite.exec('ALTER TABLE photos ADD COLUMN deleted_at TEXT')
      // 创建索引
      sqlite.exec('CREATE INDEX IF NOT EXISTS idx_photos_deleted ON photos(deleted_at)')
    }
  } catch (error) {
    console.error('数据库迁移出错:', error)
  }
}
