import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import sharp from 'sharp';
import exifr from 'exifr';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../sqlite.js';
import { requireAuthMiddleware } from './auth.js';
import { originalsDir, thumbsDir } from '../utils/paths.js';

export const photosRouter = express.Router();

// 页面：照片列表（某个相册）
photosRouter.get('/album/:albumId', (req, res) => {
	const { albumId } = req.params;
	res.render('photos/index', { title: '照片', page: 'photos', albumId });
});

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, originalsDir);
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname) || '.jpg';
		cb(null, uuidv4().replace(/-/g, '') + ext);
	},
});

function fileFilter(req, file, cb) {
	if (/^image\//.test(file.mimetype)) cb(null, true);
	else cb(new Error('仅支持图片上传'));
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 30 * 1024 * 1024 } });

// API：列出相册内照片（含 display_name 与 exif_summary）
photosRouter.get('/api/album/:albumId', (req, res) => {
	const { albumId } = req.params;
	const rows = db
		.prepare('SELECT * FROM photos WHERE album_id = ? ORDER BY created_at DESC')
		.all(albumId)
		.map((p) => {
			const displayName = (p.original_filename || '').replace(/\.[^.]+$/, '');
			let exifSummary = '';
			try {
				const exif = p.exif_json ? JSON.parse(p.exif_json) : null;
				const brand = exif?.Make || '';
				const model = exif?.Model || '';
				const brandModel = [brand, model].filter(Boolean).join(' ');
				const focal = exif?.FocalLength ? `${Math.round(exif.FocalLength)}mm` : '';
				const fnum = exif?.FNumber ? `f/${Number(exif.FNumber).toFixed(1)}` : '';
				let shutter = '';
				if (exif?.ExposureTime) {
					const et = exif.ExposureTime;
					shutter = et >= 1 ? `${Math.round(et)}s` : `1/${Math.round(1 / et)}`;
				}
				const isoRaw = exif?.ISO || exif?.ISOSpeedRatings;
				const iso = isoRaw ? `ISO${isoRaw}` : '';
				const parts = [brandModel, [focal, fnum, shutter, iso].filter(Boolean).join(' ')].filter(Boolean);
				exifSummary = parts.join(' · ');
			} catch {}
			return { ...p, display_name: displayName, exif_summary: exifSummary };
		});
	res.json(rows);
});

// API：批量上传
photosRouter.post('/api/upload', requireAuthMiddleware, upload.array('photos', 50), async (req, res, next) => {
	try {
		const { albumId } = req.body;
		if (!albumId) throw new Error('albumId 必填');
		const now = new Date().toISOString();
		const inserted = [];
		for (const file of req.files) {
			const storedFilename = file.filename;
			const thumbFilename = storedFilename.replace(/(\.[^.]+)$/i, '_thumb$1');
			const originalPath = path.join(originalsDir, storedFilename);
			const thumbPath = path.join(thumbsDir, thumbFilename);

			// 读取元数据
			let width, height, exifJson = null, shotAt = null;
			try {
				const meta = await sharp(originalPath).metadata();
				width = meta.width;
				height = meta.height;
			} catch {}
			try {
				const exif = await exifr.parse(originalPath, { tiff: true, exif: true, gps: true });
				exifJson = JSON.stringify(exif || {});
				if (exif?.DateTimeOriginal) {
					shotAt = new Date(exif.DateTimeOriginal).toISOString();
				}
			} catch {}

			// 生成缩略图 512px 宽
			await sharp(originalPath).resize({ width: 512, withoutEnlargement: true }).jpeg({ quality: 80 }).toFile(thumbPath);

			const info = db
				.prepare(
					`INSERT INTO photos (album_id, original_filename, stored_filename, thumbnail_filename, mime_type, width, height, exif_json, shot_at, created_at, updated_at)
					VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.run(
					Number(albumId),
					file.originalname,
					storedFilename,
					thumbFilename,
					file.mimetype,
					width || null,
					height || null,
					exifJson,
					shotAt,
					now,
					now
				);
			inserted.push({ id: info.lastInsertRowid, storedFilename, thumbFilename });
		}

		// 更新相册时间
		db.prepare('UPDATE albums SET updated_at = ? WHERE id = ?').run(new Date().toISOString(), Number(albumId));
		res.json({ ok: true, inserted });
	} catch (err) {
		next(err);
	}
});

// API：删除照片
photosRouter.delete('/api/:id', requireAuthMiddleware, (req, res) => {
	const { id } = req.params;
	const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
	if (photo) {
		try {
			fs.rmSync(path.join(originalsDir, photo.stored_filename), { force: true });
			fs.rmSync(path.join(thumbsDir, photo.thumbnail_filename), { force: true });
		} catch {}
		db.prepare('DELETE FROM photos WHERE id = ?').run(id);
	}
	res.json({ ok: true });
});

// API：更新照片（重命名等）
photosRouter.put('/api/:id', requireAuthMiddleware, (req, res) => {
	const { id } = req.params;
	const { albumId } = req.body;
	if (albumId) {
		db.prepare('UPDATE photos SET album_id = ?, updated_at = ? WHERE id = ?').run(Number(albumId), new Date().toISOString(), id);
	}
	res.json({ ok: true });
});


