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
		const passwordHash = bcrypt.hashSync('admin', 10);
		db.prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
			.run('admin', passwordHash, new Date().toISOString());
	}
}


