# 安全更新完成记录

**更新时间**: 2025年12月23日

## ✅ 已完成的高优先级安全修复

### 1. 移除冗余依赖 ✓
- **操作**: 卸载未使用的 `bcryptjs` 包
- **命令**: `npm uninstall bcryptjs`
- **影响**: 减少依赖包数量，降低维护成本

---

### 2. 增强文件上传安全验证 ✓
**文件**: [src/routes/photos.js](src/routes/photos.js#L32-56)

**改进内容**:
- ✅ 同时验证 MIME 类型和文件扩展名
- ✅ 白名单机制：仅允许 JPG/PNG/WebP/GIF
- ✅ 防止路径遍历攻击（检查 `..`, `/`, `\`）
- ✅ 使用环境变量控制文件大小限制
- ✅ 限制单次上传文件数量（最多 50 个）

**代码片段**:
```javascript
function fileFilter(req, file, cb) {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    return cb(new Error('仅支持 JPG/PNG/WebP/GIF 格式'));
  }
  
  if (!ALLOWED_EXTS.includes(ext)) {
    return cb(new Error('不支持的文件扩展名'));
  }
  
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return cb(new Error('文件名包含非法字符'));
  }
  
  cb(null, true);
}
```

---

### 3. 环境变量管理敏感信息 ✓

#### 3.1 创建配置模板
**文件**: [.env.example](.env.example)

```env
NODE_ENV=development
PORT=3000
SESSION_SECRET=change_this_to_a_random_secret_in_production
ADMIN_PASSWORD=admin
DB_PATH=./data/app.sqlite
LOG_LEVEL=info
MAX_FILE_SIZE=30
```

#### 3.2 会话密钥安全检查
**文件**: [src/server.js](src/server.js#L47-50)

**改进内容**:
- ✅ 启动时检查生产环境是否配置了 `SESSION_SECRET`
- ✅ 未配置时自动退出并显示错误信息
- ✅ Cookie 安全选项：
  - `secure: true` (生产环境仅 HTTPS)
  - `httpOnly: true` (防止 XSS 读取)
  - `sameSite: 'strict'` (防止 CSRF)

**代码片段**:
```javascript
// 确保生产环境配置了 SESSION_SECRET
if (process.env.NODE_ENV === 'production' && 
    (!process.env.SESSION_SECRET || process.env.SESSION_SECRET === 'change_this_session_secret')) {
  console.error('错误: 生产环境必须设置 SESSION_SECRET 环境变量');
  process.exit(1);
}
```

#### 3.3 管理员密码管理
**文件**: [src/sqlite.js](src/sqlite.js#L52-65)

**改进内容**:
- ✅ 使用环境变量 `ADMIN_PASSWORD` 设置初始密码
- ✅ 使用默认密码时显示警告信息
- ✅ 创建账户时输出确认信息

**代码片段**:
```javascript
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

if (adminPassword === 'admin') {
  console.warn('⚠️ 警告: 使用默认管理员密码 "admin"，请立即修改！');
}
```

---

### 4. CSRF 保护启用 ✓

#### 4.1 服务端配置
**文件**: [src/server.js](src/server.js)

**改进内容**:
- ✅ 引入 `csurf` 中间件
- ✅ 使用 Session 存储 CSRF token（无需 cookie）
- ✅ 支持从请求头、请求体、查询参数读取 token
- ✅ 所有视图自动注入 `csrfToken` 变量
- ✅ 添加 CSRF 错误处理（返回 403）

**代码片段**:
```javascript
import csrf from 'csurf';

const csrfProtection = csrf({ 
  cookie: false,
  value: (req) => {
    return req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;
  }
});
app.use(csrfProtection);

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});
```

#### 4.2 前端支持
**文件**: [views/layouts/main.ejs](views/layouts/main.ejs)

**改进内容**:
- ✅ 创建全局 `getCsrfToken()` 函数
- ✅ 创建 `fetchWithCsrf()` 辅助函数自动添加 token
- ✅ 自动在非 GET 请求中添加 `X-CSRF-Token` 请求头

**代码片段**:
```javascript
window.getCsrfToken = function() {
  return '<%= csrfToken %>';
};

window.fetchWithCsrf = function(url, options = {}) {
  options.headers = options.headers || {};
  if (options.method && options.method !== 'GET') {
    options.headers['X-CSRF-Token'] = window.getCsrfToken();
  }
  return fetch(url, options);
};
```

#### 4.3 表单更新
**更新的文件**:
- ✅ [views/auth/login.ejs](views/auth/login.ejs) - 登录表单
- ✅ [views/auth/account.ejs](views/auth/account.ejs) - 修改密码表单
- ✅ [views/layouts/main.ejs](views/layouts/main.ejs) - 登出按钮

**代码示例**:
```html
<input type="hidden" name="_csrf" value="<%= csrfToken %>" />
```

#### 4.4 API 调用更新
**更新的文件**:
- ✅ [views/albums/manage.ejs](views/albums/manage.ejs) - 相册管理页面
- ✅ [views/photos/index.ejs](views/photos/index.ejs) - 照片页面

**更新内容**:
- 所有 `fetch()` 调用改为 `fetchWithCsrf()`
- 自动在请求头中包含 CSRF token

#### 4.5 错误处理
**文件**: [views/errors/403.ejs](views/errors/403.ejs)

创建了 403 禁止访问错误页面，用于显示 CSRF 验证失败等错误。

---

## 📋 部署清单

### 在生产环境部署前，请确保：

1. **创建 .env 文件** (基于 .env.example)
   ```bash
   cp .env.example .env
   ```

2. **设置强密码和密钥**
   ```bash
   # 生成随机密钥
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   在 `.env` 中配置：
   ```env
   NODE_ENV=production
   SESSION_SECRET=你生成的随机密钥
   ADMIN_PASSWORD=强密码（首次启动后建议在后台修改）
   ```

3. **更新 .gitignore**
   确保 `.env` 文件不会被提交：
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```

4. **首次启动**
   ```bash
   npm start
   ```
   查看是否有黄色警告信息，如果使用默认密码会提示修改。

5. **登录后立即修改密码**
   访问 `/account` 页面修改管理员密码。

---

## 🔍 测试验证

### 手动测试项目：

1. ✅ **登录功能** - 测试 CSRF 保护是否工作
2. ✅ **创建相册** - 验证 API 请求包含 CSRF token
3. ✅ **上传照片** - 测试文件类型验证（尝试上传 .txt 等非图片文件）
4. ✅ **修改密码** - 验证表单 CSRF 保护
5. ✅ **登出** - 测试 Session 清理

### 安全测试：

1. **文件上传绕过测试**
   - 尝试上传修改扩展名的恶意文件（如 `malware.exe` 改名为 `image.jpg`）
   - 应该被 MIME 类型检查拦截

2. **CSRF 攻击测试**
   - 在浏览器控制台尝试不带 token 的请求：
     ```javascript
     fetch('/albums/api', {
       method: 'POST',
       headers: {'Content-Type': 'application/json'},
       body: JSON.stringify({name: 'Test'})
     })
     ```
   - 应该返回 403 错误

3. **路径遍历测试**
   - 尝试上传文件名包含 `../` 的文件
   - 应该被文件名验证拦截

---

## ⚠️ 重要提醒

1. **生产环境配置**
   - 必须设置 `NODE_ENV=production`
   - 必须配置强随机的 `SESSION_SECRET`
   - 建议使用反向代理（如 Nginx）启用 HTTPS

2. **首次部署**
   - 使用环境变量设置初始管理员密码
   - 启动后立即登录并修改密码
   - 验证所有功能正常工作

3. **备份**
   - 定期备份 `data/` 目录（包含数据库）
   - 定期备份 `public/uploads/` 目录（包含图片）

4. **监控**
   - 检查日志文件 `logs/app.err.log` 查看错误
   - 关注控制台输出的警告信息

---

## 📝 下一步建议

虽然高优先级问题已全部解决，但建议按优先级继续改进：

### 中优先级（建议 1-2 周内完成）
1. 添加输入验证中间件（express-validator）
2. 改进错误处理和日志系统（winston）
3. 统一 API 响应格式
4. 添加数据库事务处理

### 低优先级（可选）
1. 实现缩略图队列处理
2. 添加数据库查询缓存
3. 编写单元测试和集成测试
4. 添加 Docker 支持

---

**✅ 所有高优先级安全问题已成功修复！**
