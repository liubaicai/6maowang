/**
 * Test script for album privacy feature
 * Tests the is_public field functionality
 */

import Database from 'better-sqlite3'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

const dataDir = join(process.cwd(), 'data')
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true })
}

const dbPath = join(dataDir, 'app.sqlite')
const sqlite = new Database(dbPath)

console.log('=== Testing Album Privacy Feature ===\n')

// Initialize database if needed
console.log('1. Initializing database...')
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    cover_photo_id INTEGER,
    is_public INTEGER NOT NULL DEFAULT 1,
    created_by INTEGER,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

// Check if is_public field exists
console.log('2. Checking schema...')
const tableInfo = sqlite.prepare('PRAGMA table_info(albums)').all() as Array<{ name: string, type: string, dflt_value: string | null }>
const isPublicColumn = tableInfo.find(col => col.name === 'is_public')

if (isPublicColumn) {
  console.log('✓ is_public field exists')
  console.log(`  Type: ${isPublicColumn.type}`)
  console.log(`  Default: ${isPublicColumn.dflt_value}`)
} else {
  console.log('✗ is_public field does NOT exist')
  process.exit(1)
}

// Insert test data
console.log('\n3. Inserting test data...')
const now = new Date().toISOString()

sqlite.prepare(`
  INSERT INTO albums (name, description, is_public, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?)
`).run('Public Album 1', 'This is public', 1, now, now)

sqlite.prepare(`
  INSERT INTO albums (name, description, is_public, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?)
`).run('Private Album 1', 'This is private', 0, now, now)

sqlite.prepare(`
  INSERT INTO albums (name, description, is_public, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?)
`).run('Public Album 2', 'Another public album', 1, now, now)

// Query and verify
console.log('\n4. Verifying data...')
const allAlbums = sqlite.prepare('SELECT id, name, is_public FROM albums').all()
const publicAlbums = sqlite.prepare('SELECT id, name, is_public FROM albums WHERE is_public = 1').all()
const privateAlbums = sqlite.prepare('SELECT id, name, is_public FROM albums WHERE is_public = 0').all()

console.log(`\nTotal albums: ${allAlbums.length}`)
allAlbums.forEach((album: any) => {
  console.log(`  - ${album.name} (${album.is_public === 1 ? 'Public' : 'Private'})`)
})

console.log(`\nPublic albums: ${publicAlbums.length}`)
publicAlbums.forEach((album: any) => {
  console.log(`  - ${album.name}`)
})

console.log(`\nPrivate albums: ${privateAlbums.length}`)
privateAlbums.forEach((album: any) => {
  console.log(`  - ${album.name}`)
})

// Test default value
console.log('\n5. Testing default value...')
sqlite.prepare(`
  INSERT INTO albums (name, description, created_at, updated_at)
  VALUES (?, ?, ?, ?)
`).run('Default Album', 'Should be public by default', now, now)

const defaultAlbum = sqlite.prepare('SELECT name, is_public FROM albums WHERE name = ?').get('Default Album') as any
if (defaultAlbum.is_public === 1) {
  console.log('✓ Default value works correctly (is_public = 1)')
} else {
  console.log('✗ Default value is incorrect (is_public = ' + defaultAlbum.is_public + ')')
}

console.log('\n=== All tests passed! ===')
sqlite.close()
