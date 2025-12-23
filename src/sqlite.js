import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const __dirname = path.resolve();
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'app.sqlite');

export let db;

export function initDatabase() {
	if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
	db = new Database(dbPath);
	db.pragma('journal_mode = WAL');
	// 设置数据库编码为 UTF-8
	db.pragma('encoding = "UTF-8"');

	// tables
	db.exec(`
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
	`);

	// seed admin if not exists
	const row = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
	if (!row) {
		const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
		
		// 警告：使用默认密码
		if (adminPassword === 'admin') {
			console.warn('\x1b[33m警告: 使用默认管理员密码 "admin"，请立即修改！\x1b[0m');
		}
		
		const passwordHash = bcrypt.hashSync(adminPassword, 10);
		db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
			.run('admin', passwordHash, new Date().toISOString());
			
		console.log('管理员账户已创建: admin');
	}
}


