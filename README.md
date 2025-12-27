# 遛猫网

一个简洁优雅的照片相册管理系统，基于 Nuxt 3 构建。

## 功能特性

- 📷 相册管理（创建、编辑、删除）
- 🖼️ 照片上传（支持批量上传，最多 50 张/次）
- 📸 EXIF 信息解析与展示
- 🎨 自动生成缩略图（512px 宽度）
- 🌓 深色/浅色模式切换
- 🔐 用户认证与会话管理
- 📱 响应式设计
- 🚀 **RESTful API** - 支持移动端 App 接入

## 技术栈

- **框架**: Nuxt 3 + Vue 3
- **UI**: Nuxt UI + Tailwind CSS
- **数据库**: SQLite + Drizzle ORM
- **图片处理**: Sharp
- **EXIF 解析**: exifr

## API 文档

项目提供完整的 RESTful API 供移动端 App 使用。

### API 特性

- 使用 `/api/v1` 前缀区分版本
- 支持 Bearer Token 认证（适合移动端）
- 统一的 JSON 响应格式
- 完整的错误码体系

### 快速示例

```bash
# 登录获取 Token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# 使用 Token 访问 API
curl http://localhost:3000/api/v1/albums \
  -H "Authorization: Bearer <your_token>"
```

详细文档请查看 [API 文档](./docs/API.md)

## 快速开始

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
npm run preview
```

## Docker 部署

```bash
docker-compose up -d
```

## PM2 部署

```bash
npm run build
pm2 start ecosystem.config.cjs
```

## 数据迁移

从旧项目迁移数据：

```bash
npm run migrate:data
```

## 默认账户

- 用户名：admin
- 密码：admin（首次登录后请立即修改）

## 许可证

MIT
