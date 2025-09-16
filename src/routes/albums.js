import express from 'express';
import { db } from '../sqlite.js';
import { requireAuthMiddleware } from './auth.js';

export const albumsRouter = express.Router();

// 页面：相册列表
albumsRouter.get('/', (req, res) => {
	res.render('albums/index', { title: '相册', page: 'albums' });
});

// API：列出相册
albumsRouter.get('/api', (req, res) => {
	const rows = db.prepare(`
		SELECT a.*, p.thumbnail_filename AS cover_thumb
		FROM albums a
		LEFT JOIN photos p ON p.id = a.cover_photo_id
		ORDER BY a.updated_at DESC
	`).all();
	res.json(rows);
});

// 页面：新建/编辑
albumsRouter.get('/manage', requireAuthMiddleware, (req, res) => {
	res.render('albums/manage', { title: '管理相册' });
});

// API：创建相册
albumsRouter.post('/api', requireAuthMiddleware, (req, res) => {
	const { name, description } = req.body;
	const now = new Date().toISOString();
	const info = db
		.prepare('INSERT INTO albums (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)')
		.run(name, description || '', now, now);
	res.json({ id: info.lastInsertRowid });
});

// API：更新相册
albumsRouter.put('/api/:id', requireAuthMiddleware, (req, res) => {
	const { id } = req.params;
	const { name, description } = req.body;
	const now = new Date().toISOString();
	db.prepare('UPDATE albums SET name = ?, description = ?, updated_at = ? WHERE id = ?')
		.run(name, description || '', now, id);
	res.json({ ok: true });
});

// API：删除相册
albumsRouter.delete('/api/:id', requireAuthMiddleware, (req, res) => {
	const { id } = req.params;
	db.prepare('DELETE FROM albums WHERE id = ?').run(id);
	res.json({ ok: true });
});

// API：设置封面
albumsRouter.post('/api/:id/cover', requireAuthMiddleware, (req, res) => {
	const { id } = req.params;
	const { photoId } = req.body;
	db.prepare('UPDATE albums SET cover_photo_id = ?, updated_at = ? WHERE id = ?')
		.run(photoId, new Date().toISOString(), id);
	res.json({ ok: true });
});


