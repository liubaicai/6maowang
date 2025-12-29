import Database from 'better-sqlite3'
import { join } from 'node:path'

const sqlite = new Database(join(process.cwd(), 'data', 'app.sqlite'))

const tables = ['users', 'albums', 'photos', 'tokens', 'operation_logs']

const expectedColumns: Record<string, string[]> = {
  users: ['id', 'username', 'password_hash', 'nickname', 'role', 'created_at'],
  albums: ['id', 'name', 'description', 'cover_photo_id', 'created_by', 'created_at', 'updated_at'],
  photos: ['id', 'album_id', 'original_filename', 'stored_filename', 'thumbnail_filename', 'mime_type', 'width', 'height', 'exif_json', 'shot_at', 'created_by', 'deleted_at', 'created_at', 'updated_at'],
  tokens: ['id', 'user_id', 'token', 'device_info', 'expires_at', 'created_at'],
  operation_logs: ['id', 'user_id', 'action', 'resource_type', 'resource_id', 'details', 'created_at']
}

let allGood = true
const missingTables: string[] = []
const missingColumns: { table: string; columns: string[] }[] = []

console.log('检查数据库结构...\n')

for (const table of tables) {
  const info = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)
  if (!info) {
    console.log('❌ 表不存在:', table)
    missingTables.push(table)
    allGood = false
    continue
  }
  
  const columns = (sqlite.pragma(`table_info(${table})`) as { name: string }[]).map(c => c.name)
  const expected = expectedColumns[table]
  const missing = expected.filter(c => !columns.includes(c))
  
  if (missing.length > 0) {
    console.log('❌', table, '缺少列:', missing.join(', '))
    missingColumns.push({ table, columns: missing })
    allGood = false
  } else {
    console.log('✓', table, '- 所有列完整')
  }
}

console.log('')

if (allGood) {
  console.log('✅ 数据库结构完整，无需迁移')
} else {
  console.log('⚠️  需要执行迁移')
  
  // 自动修复缺失的列
  for (const { table, columns } of missingColumns) {
    for (const col of columns) {
      console.log(`正在添加 ${table}.${col}...`)
      try {
        sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${getColumnType(table, col)}`)
        console.log(`✓ ${table}.${col} 已添加`)
      } catch (e: any) {
        console.log(`✗ ${table}.${col} 添加失败:`, e.message)
      }
    }
  }
  
  // 创建缺失的表
  for (const table of missingTables) {
    console.log(`需要手动创建表: ${table}`)
  }
}

sqlite.close()

function getColumnType(table: string, column: string): string {
  const types: Record<string, Record<string, string>> = {
    users: {
      nickname: 'TEXT',
      role: "TEXT NOT NULL DEFAULT 'admin'"
    },
    albums: {
      created_by: 'INTEGER'
    },
    photos: {
      created_by: 'INTEGER',
      deleted_at: 'TEXT'
    },
    tokens: {
      device_info: "TEXT DEFAULT ''"
    },
    operation_logs: {
      details: 'TEXT'
    }
  }
  return types[table]?.[column] || 'TEXT'
}
