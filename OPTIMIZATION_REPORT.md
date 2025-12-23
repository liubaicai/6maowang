# 遛猫网 项目优化改进报告

## 📋 项目概述
- **项目名称**: 遛猫网（Photo Gallery）
- **技术栈**: Node.js(ESM) + Express 5 + EJS + Vue3(CDN) + SQLite3
- **功能**: 相册管理、照片上传、EXIF 解析、缩略图生成、瀑布流浏览
- **部署方案**: PM2 + SQLite 本地存储

---

## 🔴 **高优先级问题**

### 1. **安全性问题 - 默认密码和会话密钥**
**位置**: [src/sqlite.js](src/sqlite.js#L27-L30), [src/server.js](src/server.js#L47)

**问题**:
- 默认用户密码硬编码为 `admin`
- Session Secret 在生产环境使用默认值 `change_this_session_secret`
- 未实现 CSRF 保护（虽然已引入 csurf 但未使用）

**建议**:
```javascript
// 1. 使用环境变量管理敏感信息
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change_me_in_production';

// 2. 启用 CSRF 保护
import csrf from 'csurf';
app.use(csrf());

// 3. 在模板中添加 CSRF token
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
```

---

### 2. **依赖冗余 - bcryptjs 和 bcrypt 共存**
**位置**: [package.json](package.json#L16-L17)

**问题**:
- 项目同时依赖 `bcrypt` 和 `bcryptjs`，只使用了 `bcrypt`
- `bcryptjs` 完全未使用，浪费空间和维护成本

**建议**:
```bash
npm uninstall bcryptjs
```
后续仅使用 `bcrypt` 即可。

---

### 3. **图片处理安全性**
**位置**: [src/routes/photos.js](src/routes/photos.js#L32-L35)

**问题**:
- 文件过滤只检查 MIME 类型，可被绕过
- 无文件名验证，可能存在路径遍历风险
- 上传文件大小限制为 30MB，较大但未明确记录限制

**建议**:
```javascript
// 增强文件过滤
function fileFilter(req, file, cb) {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  if (ALLOWED_TYPES.includes(file.mimetype) && ALLOWED_EXTS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 JPG/PNG/WebP/GIF 格式'));
  }
}
```

---

## 🟡 **中优先级改进**

### 4. **错误处理不完善**
**位置**: [src/routes/photos.js](src/routes/photos.js#L67-L99)

**问题**:
- 元数据提取失败时仅 try-catch，无日志记录
- 删除文件时使用 `force: true`，隐藏实际错误
- 缺少对数据库错误的统一处理

**建议**:
```javascript
// 添加日志中间件
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// 在 catch 块中记录错误
try {
  const exif = await exifr.parse(originalPath);
} catch (err) {
  logger.warn(`EXIF parsing failed for ${storedFilename}`, { error: err.message });
}
```

---

### 5. **SQL 注入防护**
**位置**: 全项目 SQL 操作

**优点**: ✅ 已正确使用参数化查询（prepared statements）

**建议**: 继续保持当前做法，完全避免了 SQL 注入风险。

---

### 6. **缺少输入验证**
**位置**: [src/routes/albums.js](src/routes/albums.js#L32-L36), [src/routes/photos.js](src/routes/photos.js#L155-L158)

**问题**:
- 相册名称无长度限制（数据库可能无约束）
- 照片文件名重命名无验证，可能包含特殊字符
- 无数据类型验证

**建议**:
```javascript
import { body, validationResult } from 'express-validator';

// 相册创建验证
albumsRouter.post('/api',
  requireAuthMiddleware,
  body('name').trim().isLength({ min: 1, max: 100 }).escape(),
  body('description').trim().isLength({ max: 500 }).escape(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // 处理...
  }
);
```

---

### 7. **缺失错误处理 - API 端点**
**位置**: [src/routes/albums.js](src/routes/albums.js#L38-L50), [src/routes/photos.js](src/routes/photos.js#L132-L145)

**问题**:
- DELETE/PUT 端点无返回状态码检查
- 未验证相册/照片是否存在再删除
- 无事务处理，删除相册时可能与照片删除不同步

**建议**:
```javascript
// 改进删除相册逻辑
albumsRouter.delete('/api/:id', requireAuthMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const album = db.prepare('SELECT id FROM albums WHERE id = ?').get(id);
    
    if (!album) {
      return res.status(404).json({ error: '相册不存在' });
    }
    
    // 使用事务确保一致性
    const deleteAlbum = db.transaction(() => {
      const photos = db.prepare('SELECT * FROM photos WHERE album_id = ?').all(id);
      photos.forEach(photo => {
        // 删除文件...
      });
      db.prepare('DELETE FROM albums WHERE id = ?').run(id);
    });
    
    deleteAlbum();
    res.json({ ok: true });
  } catch (err) {
    logger.error('Album deletion failed', err);
    res.status(500).json({ error: '删除失败' });
  }
});
```

---

## 🟢 **低优先级优化建议**

### 8. **代码结构优化**

#### 8.1 **提取重复代码**
**位置**: [src/routes/photos.js](src/routes/photos.js#L54-L72)

当前 EXIF 解析逻辑在多处重复：
```javascript
// 建议: 创建工具函数
// src/utils/exif.js
export function parseExifSummary(exifJson) {
  try {
    const exif = exifJson ? JSON.parse(exifJson) : null;
    if (!exif) return '';
    
    const brand = exif.Make || '';
    const model = exif.Model || '';
    const brandModel = [brand, model].filter(Boolean).join(' ');
    // ... rest of logic
    
    return parts.join(' · ');
  } catch {
    return '';
  }
}

// 在路由中使用
const exifSummary = parseExifSummary(p.exif_json);
```

#### 8.2 **API 响应统一格式**
**问题**: 响应格式不一致
- 某些返回 `{ ok: true }`
- 某些返回 `{ id: ... }`
- 错误时直接渲染页面而非 JSON

**建议**:
```javascript
// src/utils/response.js
export const ApiResponse = {
  success: (data = null) => ({ success: true, data }),
  error: (message, code = 'ERROR') => ({ success: false, error: { message, code } })
};

// 使用
res.json(ApiResponse.success({ id: info.lastInsertRowid }));
res.status(400).json(ApiResponse.error('用户名已存在', 'USERNAME_EXISTS'));
```

---

### 9. **性能优化**

#### 9.1 **缩略图生成性能**
**位置**: [src/routes/photos.js](src/routes/photos.js#L91-96)

当前: 每次上传都生成缩略图（I/O 密集型）

**建议**:
```javascript
// 考虑使用队列处理缩略图生成
import Bull from 'bull';

const thumbnailQueue = new Bull('thumbnails');

thumbnailQueue.process(async (job) => {
  const { originalPath, thumbPath } = job.data;
  await sharp(originalPath)
    .rotate()
    .resize({ width: 512, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(thumbPath);
});

// 上传时入队
if (req.files.length > 0) {
  for (const file of req.files) {
    await thumbnailQueue.add({ originalPath, thumbPath });
  }
}
```

#### 9.2 **数据库查询优化**
**位置**: [src/routes/albums.js](src/routes/albums.js#L17-21)

当前: 每次查询都 JOIN photos，未使用索引

**建议**:
```javascript
// 添加索引
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_albums_updated_at ON albums(updated_at);
  CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
  CREATE INDEX IF NOT EXISTS idx_albums_cover_photo ON albums(cover_photo_id);
`);

// 考虑缓存常用查询
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟
let albumsCache = { data: null, time: 0 };

albumsRouter.get('/api', (req, res) => {
  const now = Date.now();
  if (albumsCache.data && now - albumsCache.time < CACHE_TTL) {
    return res.json(albumsCache.data);
  }
  
  const rows = db.prepare(`...`).all();
  albumsCache = { data: rows, time: now };
  res.json(rows);
});
```

#### 9.3 **前端加载性能**
**位置**: [views/layouts/main.ejs](views/layouts/main.ejs#L10)

当前: 使用 CDN 加载 Vue3 完整版

**建议**:
```html
<!-- 使用更小的 Vue3 全局版本，或考虑打包 -->
<!-- 当前: vue.global.min.js (~34KB gzipped) -->
<!-- 改进: 添加 Service Worker 缓存 -->

<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
</script>
```

---

### 10. **数据库设计改进**

#### 10.1 **缺失的字段**
**位置**: [src/sqlite.js](src/sqlite.js#L12-42)

建议添加:
```javascript
CREATE TABLE IF NOT EXISTS albums (
  -- ... existing columns
  deleted_at TEXT, -- 软删除支持
  is_public INTEGER DEFAULT 1, -- 相册是否公开
  sort_order INTEGER, -- 排序
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  -- ... existing columns
  is_favorite INTEGER DEFAULT 0, -- 收藏标记
  description TEXT, -- 照片描述
  deleted_at TEXT -- 软删除
);
```

#### 10.2 **缺失索引**
```javascript
CREATE INDEX IF NOT EXISTS idx_albums_deleted_at ON albums(deleted_at);
CREATE INDEX IF NOT EXISTS idx_photos_deleted_at ON photos(deleted_at);
CREATE INDEX IF NOT EXISTS idx_photos_favorite ON photos(is_favorite);
CREATE INDEX IF NOT EXISTS idx_photos_shot_at ON photos(shot_at);
```

---

### 11. **环境配置**

**位置**: [ecosystem.config.cjs](ecosystem.config.cjs)

**问题**:
- 硬编码的端口和密钥
- 无环境区分（开发/生产）
- 日志路径未检查是否存在

**建议**:
```javascript
// ecosystem.config.cjs
const env = process.env.NODE_ENV || 'production';

module.exports = {
  apps: [
    {
      name: '6maowang',
      script: 'src/server.js',
      exec_mode: 'fork',
      instances: env === 'production' ? 'max' : 1,
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        SESSION_SECRET: process.env.SESSION_SECRET,
      },
      max_memory_restart: '512M',
      error_file: 'logs/app.err.log',
      out_file: 'logs/app.out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

---

### 12. **前端交互改进**

#### 12.1 **上传提示缺失**
**位置**: [views/photos/index.ejs](views/photos/index.ejs#L30)

当前: 上传时无进度提示

**建议**:
```javascript
const upload = async () => {
  if (!files.value?.length) return;
  
  const fd = new FormData();
  fd.append('albumId', String(albumId));
  for (const f of files.value) fd.append('photos', f);
  
  try {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      const percent = Math.round((e.loaded / e.total) * 100);
      msg.value = `上传中... ${percent}%`;
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        msg.value = '已上传';
        load();
      } else {
        msg.value = '上传失败';
      }
    });
    
    xhr.open('POST', '/photos/api/upload');
    xhr.send(fd);
  } catch (err) {
    msg.value = '上传失败: ' + err.message;
  }
};
```

#### 12.2 **确认对话框体验**
**位置**: [views/photos/index.ejs](views/photos/index.ejs#L75-76)

当前: 使用浏览器原生 `confirm()`

**建议**: 使用自定义确认对话框，提升 UX

---

### 13. **缺失的功能与文档**

#### 13.1 **缺失 .env.example**
建议创建模板文件:
```
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-secret-key
ADMIN_PASSWORD=admin
DB_PATH=./data/app.sqlite
LOG_LEVEL=info
```

#### 13.2 **缺失 API 文档**
当前无 API 文档，建议:
- 添加 OpenAPI/Swagger 文档
- 使用 `@apiDoc` 注释标记端点

#### 13.3 **缺失使用说明**
建议在 README 中补充:
- Docker 部署方案
- 备份恢复流程
- 性能调优指南

---

### 14. **测试覆盖**

**问题**: 无任何测试代码

**建议添加**:
```bash
npm install --save-dev jest supertest
```

```javascript
// tests/routes/albums.test.js
import request from 'supertest';
import app from '../../src/server.js';

describe('Albums API', () => {
  test('GET /albums/api returns list', async () => {
    const res = await request(app).get('/albums/api');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /albums/api creates album', async () => {
    const res = await request(app)
      .post('/albums/api')
      .set('Cookie', 'sessionid=...')
      .send({ name: 'Test Album' });
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBeDefined();
  });
});
```

---

## 📊 **优先级清单**

| 优先级 | 项目 | 工作量 | 风险 |
|------|------|--------|-----|
| 🔴 高 | 安全性（默认密码、会话密钥、CSRF） | 中 | 高 |
| 🔴 高 | 文件上传安全验证 | 小 | 中 |
| 🔴 高 | 移除冗余依赖（bcryptjs） | 小 | 低 |
| 🟡 中 | 错误处理和日志 | 中 | 低 |
| 🟡 中 | 输入验证 | 大 | 中 |
| 🟡 中 | API 响应统一格式 | 中 | 低 |
| 🟡 中 | 数据库事务处理 | 小 | 中 |
| 🟢 低 | 缩略图队列处理 | 大 | 低 |
| 🟢 低 | 数据库缓存 | 中 | 低 |
| 🟢 低 | 测试编写 | 大 | 低 |

---

## ✅ **项目亮点**

- ✅ 正确使用参数化查询，完全避免 SQL 注入
- ✅ 合理的文件夹结构和模块划分
- ✅ 使用 WAL 模式提升 SQLite 并发性能
- ✅ 良好的 EXIF 数据提取和展示
- ✅ 简洁的 UI 设计和瀑布流布局实现
- ✅ 使用 Express 5 (最新版本)
- ✅ 合理使用中间件模式

---

## 🚀 **快速行动方案**

### 第一阶段（立即实施）
1. ✅ 移除 bcryptjs 依赖
2. ✅ 启用 CSRF 保护
3. ✅ 增强文件类型验证
4. ✅ 创建 .env.example

### 第二阶段（1-2 周）
1. ✅ 添加输入验证中间件
2. ✅ 改进错误处理和日志
3. ✅ 统一 API 响应格式
4. ✅ 添加缺失的数据库索引

### 第三阶段（可选）
1. ✅ 实现缩略图队列处理
2. ✅ 添加基础测试用例
3. ✅ 编写 API 文档
4. ✅ Docker 部署支持

---

*报告生成时间: 2025年12月23日*
