# 遛猫网（相册网站）

## 简介

基于 Node.js + Express + EJS + Vue3 + SQLite 的轻量相册网站：支持相册管理、照片批量上传、EXIF 解析与缩略图生成，瀑布流浏览，登录后可进行增删改查与设置相册封面。

### 主要特性

- **相册管理**：新建、编辑、删除相册，支持设置封面
- **照片上传**：批量上传（原图保存 + 自动生成缩略图）
- **EXIF 解析**：读取拍摄时间、相机信息、曝光参数、GPS 等并写入数据库
- **瀑布流浏览**：相册与照片列表均为 CSS columns 实现的瀑布流布局
- **登录与会话**：用户名固定 `admin`，支持修改密码，Session 基于 SQLite 持久化
- **简单部署**：本地 SQLite 存储，无需额外服务；生产可直接丢到任意 Node 环境

### 技术栈

- 运行时：Node.js (ESM)
- Web 框架：Express 5
- 视图层：EJS + express-ejs-layouts，前端增强用 Vue3（CDN）
- 存储：better-sqlite3（图片文件存于 `public/uploads`）
- 上传与图像：multer、sharp
- 元数据：exifr（解析 EXIF/GPS）
- 会话：express-session + connect-sqlite3
- 其他：helmet（安全）、compression（压缩）、morgan（日志）

### 目录结构

```text
.
├─ src/
│  ├─ server.js           # 应用入口（路由、会话、中间件、错误处理）
│  ├─ sqlite.js           # SQLite 初始化与种子数据
│  ├─ routes/
│  │  ├─ auth.js         # 登录、注销、修改密码；中间件导出
│  │  ├─ albums.js       # 相册页面与相册 API
│  │  └─ photos.js       # 照片页面与照片 API（上传、删除等）
│  └─ utils/paths.js     # 静态资源与上传目录路径工具
├─ views/                 # EJS 视图
│  ├─ layouts/main.ejs   # 布局（含导航、样式与脚本）
│  ├─ albums/            # 相册相关页面（列表、管理）
│  ├─ photos/            # 照片列表与上传页面
│  ├─ auth/              # 登录、账户设置
│  └─ errors/            # 404、500
├─ public/
│  ├─ css/style.css      # 基础样式（含瀑布流）
│  ├─ js/app.js          # 预留前端脚本
│  └─ uploads/           # 图片文件（originals 原图 / thumbs 缩略图）
└─ data/
   ├─ app.sqlite         # 应用数据库
   └─ sessions.sqlite    # 会话数据库
```

### 快速开始

要求：Node.js 18+（推荐 LTS）。项目为 ESM（`"type": "module"`）。

```bash
git clone <your-repo-url>
cd 6maowang
npm i

# 开发模式（自动重启）
npm run dev

# 或生产启动
npm start
```

启动后访问：`http://localhost:3000`

### 账号与权限

- 初始账号：`admin`
- 初始密码：`admin`
- 登录后可访问：
  - `GET /albums/manage` 相册管理页（新建、编辑、删除）
  - `GET /photos/album/:albumId` 照片页（批量上传、设封面、删除）
- 修改密码：`GET /account` 页面表单，提交到 `POST /account/password`

### 环境变量

无需 `.env` 即可运行，默认值如下：

- `PORT`：默认 `3000`
- `SESSION_SECRET`：默认 `change_this_session_secret`

在启动前也可通过命令行注入，例如：

```bash
# Linux / macOS
SESSION_SECRET='your-secret' PORT=8080 npm start

# Windows PowerShell
$env:SESSION_SECRET='your-secret'; $env:PORT='8080'; npm start
```

### 使用说明

- 首页（相册列表）：`/` 或 `GET /albums`
- 相册管理：`GET /albums/manage`
- 某相册下的照片页：`GET /photos/album/:albumId`
- 照片上传：在照片页登录后选择多张图片提交即可；原图会保存在 `public/uploads/originals`，缩略图保存在 `public/uploads/thumbs`，EXIF 会写入数据库。
- 图片查看：列表显示缩略图，点击打开原图（新窗口）。

### API（简要）

- 相册
  - `GET /albums/api` 获取相册列表
  - `POST /albums/api` 新建相册（需登录）
  - `PUT /albums/api/:id` 更新相册（需登录）
  - `DELETE /albums/api/:id` 删除相册（需登录）
  - `POST /albums/api/:id/cover` 设置相册封面（需登录）
- 照片
  - `GET /photos/api/album/:albumId` 获取相册内照片（含 EXIF 摘要）
  - `POST /photos/api/upload` 批量上传照片（需登录；字段：`albumId` 与 `photos[]`）
  - `DELETE /photos/api/:id` 删除照片（需登录）
  - `PUT /photos/api/:id` 更新照片信息（如移动到其他相册，需登录）
- 认证
  - `GET /login` 登录页
  - `POST /login` 登录
  - `POST /logout` 注销
  - `GET /account` 账户设置页
  - `POST /account/password` 修改密码

### 数据说明

- 数据库文件：`data/app.sqlite`
- 会话存储：`data/sessions.sqlite`
- 原图目录：`public/uploads/originals`
- 缩略图目录：`public/uploads/thumbs`

### 常见问题

- better-sqlite3 安装失败：
  - 请选择 Node LTS 版本；Windows 建议安装最新的 Node 官方安装包（自带合适的工具链）。
- 缩略图未生成：
  - 请确认系统已允许 sharp 读取/写入 `public/uploads` 目录，并检查日志输出。

### 许可证

当前未设置许可证。如需开源，请在仓库中添加合适的 LICENSE 文件。

### 计划&扩展

- 标签与搜索、EXIF 地图、相册分享链接、批量操作优化、拖拽排序等。
