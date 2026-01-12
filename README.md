<div align="center">
  <img src="public/icon-512.png" alt="遛猫网" width="120" height="120">
  
  # 遛猫网 / 6Mao Photo Gallery
  
  [![Nuxt](https://img.shields.io/badge/Nuxt-3.x-00DC82?style=flat-square&logo=nuxt.js&logoColor=white)](https://nuxt.com/)
  [![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat-square&logo=vue.js&logoColor=white)](https://vuejs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

  **一个简洁优雅的照片相册管理系统**
  
  *A minimalist and elegant photo album management system*

  [功能特性](#-功能特性) •
  [快速开始](#-快速开始) •
  [部署方式](#-部署方式) •
  [API 文档](#-api-文档) •
  [许可证](#-许可证)

</div>

---

## ✨ 功能特性

<table>
  <tr>
    <td>📷 <b>相册管理</b></td>
    <td>创建、编辑、删除相册，灵活管理照片分类</td>
  </tr>
  <tr>
    <td>🖼️ <b>批量上传</b></td>
    <td>支持批量上传照片，单次最多 50 张</td>
  </tr>
  <tr>
    <td>📸 <b>EXIF 信息</b></td>
    <td>自动解析并展示照片 EXIF 信息</td>
  </tr>
  <tr>
    <td>🎨 <b>智能缩略图</b></td>
    <td>自动生成高质量缩略图（512px 宽度）</td>
  </tr>
  <tr>
    <td>🌓 <b>主题切换</b></td>
    <td>支持深色/浅色模式自动切换</td>
  </tr>
  <tr>
    <td>🔐 <b>安全认证</b></td>
    <td>用户认证与会话管理，保护隐私照片</td>
  </tr>
  <tr>
    <td>📱 <b>响应式设计</b></td>
    <td>完美适配桌面端和移动端</td>
  </tr>
  <tr>
    <td>🚀 <b>RESTful API</b></td>
    <td>提供完整 API，支持移动端 App 接入</td>
  </tr>
  <tr>
    <td>☁️ <b>S3 存储</b></td>
    <td>支持 S3 兼容对象存储（AWS、MinIO、阿里云 OSS 等）</td>
  </tr>
  <tr>
    <td>🎞️ <b>幻灯片</b></td>
    <td>全屏幻灯片播放，支持多种过渡效果</td>
  </tr>
</table>

## 🛠️ 技术栈

<table>
  <tr>
    <td align="center"><b>前端框架</b></td>
    <td>
      <img src="https://img.shields.io/badge/Nuxt-3-00DC82?style=flat-square&logo=nuxt.js&logoColor=white" alt="Nuxt 3">
      <img src="https://img.shields.io/badge/Vue-3-4FC08D?style=flat-square&logo=vue.js&logoColor=white" alt="Vue 3">
    </td>
  </tr>
  <tr>
    <td align="center"><b>UI 组件</b></td>
    <td>
      <img src="https://img.shields.io/badge/Nuxt_UI-4.x-00DC82?style=flat-square&logo=nuxt.js&logoColor=white" alt="Nuxt UI">
      <img src="https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS">
    </td>
  </tr>
  <tr>
    <td align="center"><b>数据库</b></td>
    <td>
      <img src="https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite">
      <img src="https://img.shields.io/badge/Drizzle_ORM-0.45.x-C5F74F?style=flat-square&logo=drizzle&logoColor=black" alt="Drizzle ORM">
    </td>
  </tr>
  <tr>
    <td align="center"><b>图像处理</b></td>
    <td>
      <img src="https://img.shields.io/badge/Sharp-0.34-99CC00?style=flat-square&logo=sharp&logoColor=white" alt="Sharp">
      <img src="https://img.shields.io/badge/exifr-7.x-FF6B6B?style=flat-square" alt="exifr">
    </td>
  </tr>
  <tr>
    <td align="center"><b>运行环境</b></td>
    <td>
      <img src="https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
      <img src="https://img.shields.io/badge/pnpm-10.x-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm">
    </td>
  </tr>
</table>

## 🚀 快速开始

### 前置要求

- Node.js 20+
- pnpm 10+

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/liubaicai/6maowang.git
cd 6maowang

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，修改必要配置

# 启动开发服务器
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可看到应用。

### 默认账户

| 用户名 | 密码 |
|:------:|:----:|
| admin  | admin |

> ⚠️ **安全提示**：首次登录后请立即修改默认密码！

## 📦 部署方式

### Docker 部署（推荐）

```bash
# 使用 docker-compose 一键部署
docker-compose up -d
```

### PM2 部署

```bash
# 构建生产版本
pnpm build

# 使用 PM2 启动
pm2 start ecosystem.config.cjs
```

### 手动部署

```bash
# 构建
pnpm build

# 启动
pnpm start
```

## ⚙️ 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NUXT_SESSION_PASSWORD` | Session 密钥（至少 32 位） | - |
| `ADMIN_PASSWORD` | 管理员初始密码 | `admin` |
| `MAX_FILE_SIZE` | 文件上传大小限制（MB） | `30` |
| `DATABASE_PATH` | 数据库文件路径 | `./data/app.sqlite` |
| `PORT` | 服务端口 | `3000` |

## 📖 API 文档

项目提供完整的 RESTful API 供移动端 App 使用。

### API 特性

- ✅ 使用 `/api/v1` 前缀区分版本
- ✅ 支持 Bearer Token 认证（适合移动端）
- ✅ 统一的 JSON 响应格式
- ✅ 完整的错误码体系

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

📚 完整 API 文档请查看：[API 文档](./docs/API.md)

## 📁 项目结构

```
6maowang/
├── app/                    # Nuxt 应用目录
│   ├── components/         # Vue 组件
│   ├── layouts/            # 布局组件
│   ├── middleware/         # 中间件
│   ├── pages/              # 页面路由
│   └── types/              # TypeScript 类型定义
├── server/                 # 服务端代码
├── public/                 # 静态资源
├── data/                   # 数据存储目录
├── docs/                   # 项目文档
│   ├── API.md              # API 文档
│   └── openapi.yaml        # OpenAPI 规范
├── scripts/                # 脚本工具
├── docker-compose.yml      # Docker 编排配置
├── Dockerfile              # Docker 构建文件
├── ecosystem.config.cjs    # PM2 配置
└── nuxt.config.ts          # Nuxt 配置
```

## 🔄 数据迁移

从旧版本迁移数据：

```bash
pnpm migrate:data
```

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE) 开源。

---

<div align="center">
  <sub>Made with ❤️ by <a href="https://github.com/liubaicai">liubaicai</a></sub>
</div>
