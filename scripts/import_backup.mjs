#!/usr/bin/env node
// 导入旧 JSON 备份到本项目（通过 HTTP 接口）
// 使用示例：
// node scripts/import_backup.mjs d:/Downloads/backup.json --base http://localhost:3000 --user admin --pass admin

import fs from 'node:fs';
import path from 'node:path';

// 简单参数解析
const args = process.argv.slice(2);
if (!args[0]) {
  console.error('用法: node scripts/import_backup.mjs <backup.json> [--base http://localhost:3000] [--user admin] [--pass admin]');
  process.exit(1);
}
const filePath = args[0];
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};
const BASE = getArg('--base', 'http://localhost:3000');
const USER = getArg('--user', 'admin');
const PASS = getArg('--pass', 'admin');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 读取 JSON 备份
const raw = fs.readFileSync(path.resolve(filePath), 'utf8');
const obj = JSON.parse(raw);
const galleries = obj.galleries || obj.albums || [];
const photos = obj.photos || [];

// 登录，返回 cookie 字符串
async function login() {
  const body = new URLSearchParams({ username: USER, password: PASS });
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    redirect: 'manual', // 为了拿到 Set-Cookie
  });
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error('登录失败：未收到 Set-Cookie，请检查账号密码或服务是否已启动');
  }
  const cookie = setCookie.split(';')[0];
  return cookie;
}

async function createAlbum(cookie, name, description) {
  const res = await fetch(`${BASE}/albums/api`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ name, description: description || '' }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`创建相册失败: ${res.status} ${txt}`);
  }
  const data = await res.json();
  return data.id;
}

async function uploadPhoto(cookie, albumId, fileBuffer, filename, mime = 'image/jpeg') {
  const fd = new FormData();
  fd.append('albumId', String(albumId));
  const blob = new Blob([fileBuffer], { type: mime });
  fd.append('photos', blob, filename);
  const res = await fetch(`${BASE}/photos/api/upload`, { method: 'POST', headers: { Cookie: cookie }, body: fd });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`上传照片失败: ${res.status} ${txt}`);
  }
  return res.json();
}

function guessFilenameFromUrl(url) {
  try { return decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).pop() || 'image.jpg'); } catch { return 'image.jpg'; }
}

function guessMimeFromUrl(url) {
  const u = String(url).toLowerCase();
  if (u.endsWith('.png')) return 'image/png';
  if (u.endsWith('.webp')) return 'image/webp';
  if (u.endsWith('.gif')) return 'image/gif';
  if (u.endsWith('.bmp')) return 'image/bmp';
  if (u.endsWith('.jpeg') || u.endsWith('.jpg')) return 'image/jpeg';
  return 'image/jpeg';
}

async function downloadToBuffer(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`下载失败: ${r.status} ${url}`);
  const buf = Buffer.from(await r.arrayBuffer());
  const ct = r.headers.get('content-type') || guessMimeFromUrl(url);
  return { buffer: buf, mime: ct };
}

async function main() {
  console.log(`[导入] 目标 ${BASE}`);
  const cookie = await login();
  console.log('[导入] 登录成功');

  // 1) 导入相册
  const idMap = new Map(); // oldId -> newId
  for (let i = 0; i < galleries.length; i++) {
    const g = galleries[i];
    const name = g.title || g.name || `相册${i+1}`;
    const description = g.description || '';
    try {
      const newId = await createAlbum(cookie, name, description);
      const oldId = g.id ?? g.gallery_id ?? i;
      idMap.set(String(oldId), newId);
      console.log(`[相册] 已创建: ${name} -> #${newId}`);
      await sleep(100);
    } catch (e) {
      console.error(`[相册] 创建失败: ${name}`, e.message);
    }
  }

  // 2) 导入照片（逐张）
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    const oldAlbumId = String(p.gallery_id ?? p.album_id ?? '');
    const newAlbumId = idMap.get(oldAlbumId);
    if (!newAlbumId) {
      console.warn(`[照片] 跳过（找不到对应相册映射）: index=${i}, oldAlbumId=${oldAlbumId}`);
      continue;
    }
    const url = p.url || p.image_url || p.src;
    if (!url) {
      console.warn(`[照片] 跳过（无 URL）: index=${i}`);
      continue;
    }
    try {
      const { buffer, mime } = await downloadToBuffer(url);
      const filename = p.original_filename || p.title || guessFilenameFromUrl(url);
      await uploadPhoto(cookie, newAlbumId, buffer, filename, mime);
      console.log(`[照片] 已导入 -> 相册#${newAlbumId}: ${filename}`);
      await sleep(50);
    } catch (e) {
      console.error(`[照片] 导入失败: ${url}`, e.message);
    }
  }

  console.log('[完成] 导入流程结束');
}

main().catch((e) => { console.error(e); process.exit(1); });


