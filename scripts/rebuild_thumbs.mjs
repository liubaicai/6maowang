#!/usr/bin/env node
// 批量重建缩略图（应用 EXIF 方向矫正，统一生成为 .jpg）
// 用法：npm run thumbs:rebuild

import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { db, initDatabase } from '../src/sqlite.js';
import { originalsDir, thumbsDir, ensureUploadsDirs } from '../src/utils/paths.js';

async function rebuild() {
  ensureUploadsDirs();
  initDatabase();
  const rows = db.prepare('SELECT id, stored_filename, thumbnail_filename FROM photos ORDER BY id').all();
  let ok = 0, fail = 0;
  for (const row of rows) {
    try {
      const orig = path.join(originalsDir, row.stored_filename);
      if (!fs.existsSync(orig)) { console.warn('[跳过] 原图不存在:', row.id, row.stored_filename); fail++; continue; }
      const newThumbName = row.stored_filename.replace(/\.[^.]+$/, '') + '_thumb.jpg';
      const dst = path.join(thumbsDir, newThumbName);
      await sharp(orig)
        .rotate() // 应用 EXIF Orientation
        .resize({ width: 512, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(dst);
      // 移除旧缩略图（若不同）
      if (row.thumbnail_filename && row.thumbnail_filename !== newThumbName) {
        try { fs.rmSync(path.join(thumbsDir, row.thumbnail_filename), { force: true }); } catch {}
      }
      db.prepare('UPDATE photos SET thumbnail_filename = ?, updated_at = ? WHERE id = ?')
        .run(newThumbName, new Date().toISOString(), row.id);
      ok++;
      if (ok % 50 === 0) console.log(`[进度] 已重建: ${ok}/${rows.length}`);
    } catch (e) {
      console.error('[失败]', row.id, e.message);
      fail++;
    }
  }
  console.log(`[完成] 成功 ${ok}，失败 ${fail}，总计 ${rows.length}`);
}

rebuild().catch((e) => { console.error(e); process.exit(1); });


