# 遛猫网 API 文档

## 概述

遛猫网 API 为移动端 App 提供完整的相册管理功能。所有 v1 版本的 API 统一使用 `/api/v1` 前缀。

### 基础信息

- **Base URL**: `https://your-domain.com/api/v1`
- **协议**: HTTPS
- **数据格式**: JSON

### 统一响应格式

所有 API 响应都采用统一的 JSON 格式：

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {},
  "timestamp": 1703664000000
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| code | number | 业务状态码，0 表示成功，其他表示错误 |
| message | string | 操作结果描述 |
| data | object/array/null | 响应数据 |
| timestamp | number | 服务器响应时间戳（毫秒） |

### 分页响应格式

列表类接口返回分页数据：

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "list": [],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "totalPages": 5
  },
  "timestamp": 1703664000000
}
```

### 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1000 | 通用错误 |
| 1001 | 参数缺失 |
| 1002 | 认证失败（用户名或密码错误） |
| 1003 | 缺少认证令牌 |
| 1004 | 令牌无效或已过期 |
| 1005 | 令牌刷新失败 |
| 2000 | 相册操作错误 |
| 2001 | 相册 ID 不能为空 |
| 2002 | 相册不存在 |
| 2003 | 相册名称无效 |
| 2004 | 照片不属于该相册 |
| 3000 | 照片操作错误 |
| 3001 | 照片 ID 不能为空 |
| 3002 | 照片不存在 |
| 4000 | 统计信息错误 |

---

## 认证

### 认证方式

API 支持 **Bearer Token** 认证。在需要认证的接口中，请在请求头添加：

```
Authorization: Bearer <your_access_token>
```

### Token 有效期

- 默认有效期：7 天
- 可通过刷新接口延长有效期

---

## 接口列表

### 1. 认证相关

#### 1.1 登录

获取访问令牌。

**请求**

```
POST /api/v1/auth/login
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | ✓ | 用户名 |
| password | string | ✓ | 密码 |
| deviceInfo | string | ✗ | 设备信息（用于多设备管理） |

**请求示例**

```json
{
  "username": "admin",
  "password": "your_password",
  "deviceInfo": "iPhone 15 Pro"
}
```

**响应示例**

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "a1b2c3d4e5f6...",
    "expiresAt": "2024-01-03T10:00:00.000Z",
    "user": {
      "id": 1,
      "username": "admin"
    }
  },
  "timestamp": 1703664000000
}
```

---

#### 1.2 登出

撤销当前令牌。

**请求**

```
POST /api/v1/auth/logout
```

**请求头**

```
Authorization: Bearer <token>
```

**响应示例**

```json
{
  "code": 0,
  "message": "登出成功",
  "data": null,
  "timestamp": 1703664000000
}
```

---

#### 1.3 刷新令牌

延长当前令牌的有效期。

**请求**

```
POST /api/v1/auth/refresh
```

**请求头**

```
Authorization: Bearer <token>
```

**响应示例**

```json
{
  "code": 0,
  "message": "令牌刷新成功",
  "data": {
    "token": "a1b2c3d4e5f6...",
    "expiresAt": "2024-01-10T10:00:00.000Z",
    "user": {
      "id": 1,
      "username": "admin"
    }
  },
  "timestamp": 1703664000000
}
```

---

#### 1.4 获取用户信息

获取当前登录用户信息。

**请求**

```
GET /api/v1/auth/profile
```

**请求头**

```
Authorization: Bearer <token>
```

**响应示例**

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "admin"
  },
  "timestamp": 1703664000000
}
```

---

### 2. 相册管理

#### 2.1 获取相册列表

获取所有相册，支持分页。**无需认证**。

**请求**

```
GET /api/v1/albums
```

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | ✗ | 1 | 页码 |
| pageSize | number | ✗ | 20 | 每页数量（最大 100） |

**响应示例**

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "我的相册",
        "description": "相册描述",
        "coverPhotoId": 10,
        "coverThumb": "thumb_abc123.jpg",
        "photoCount": 50,
        "createdAt": "2024-01-01T10:00:00.000Z",
        "updatedAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "pageSize": 20,
    "totalPages": 1
  },
  "timestamp": 1703664000000
}
```

---

#### 2.2 获取相册详情

获取单个相册信息。**无需认证**。

**请求**

```
GET /api/v1/albums/:id
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| id | number | 相册 ID |

**响应示例**

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "我的相册",
    "description": "相册描述",
    "coverPhotoId": 10,
    "coverThumb": "thumb_abc123.jpg",
    "photoCount": 50,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  },
  "timestamp": 1703664000000
}
```

---

#### 2.3 创建相册

创建新相册。**需要认证**。

**请求**

```
POST /api/v1/albums
```

**请求头**

```
Authorization: Bearer <token>
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✓ | 相册名称（1-50 字符） |
| description | string | ✗ | 相册描述 |

**响应示例**

```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 2,
    "name": "新相册",
    "description": "描述",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  },
  "timestamp": 1703664000000
}
```

---

#### 2.4 更新相册

更新相册信息。**需要认证**。

**请求**

```
PUT /api/v1/albums/:id
```

**请求头**

```
Authorization: Bearer <token>
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | ✓ | 相册名称 |
| description | string | ✗ | 相册描述 |

**响应示例**

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 1,
    "name": "更新后的名称",
    "description": "更新后的描述",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": 1703664000000
}
```

---

#### 2.5 删除相册

删除相册及其所有照片。**需要认证**。

**请求**

```
DELETE /api/v1/albums/:id
```

**请求头**

```
Authorization: Bearer <token>
```

**响应示例**

```json
{
  "code": 0,
  "message": "删除成功",
  "data": {
    "id": 1
  },
  "timestamp": 1703664000000
}
```

---

#### 2.6 设置相册封面

设置相册封面照片。**需要认证**。

**请求**

```
POST /api/v1/albums/:id/cover
```

**请求头**

```
Authorization: Bearer <token>
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| photoId | number | ✓ | 照片 ID（必须属于该相册） |

**响应示例**

```json
{
  "code": 0,
  "message": "设置成功",
  "data": {
    "albumId": 1,
    "coverPhotoId": 10
  },
  "timestamp": 1703664000000
}
```

---

#### 2.7 获取相册照片

获取相册内的照片列表，支持分页。**无需认证**。

**请求**

```
GET /api/v1/albums/:id/photos
```

**查询参数**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | ✗ | 1 | 页码 |
| pageSize | number | ✗ | 20 | 每页数量（最大 100） |

**响应示例**

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "albumId": 1,
        "originalFilename": "photo.jpg",
        "storedFilename": "abc123.jpg",
        "thumbnailFilename": "thumb_abc123.jpg",
        "mimeType": "image/jpeg",
        "width": 1920,
        "height": 1080,
        "displayName": "photo",
        "exifSummary": "iPhone 15 Pro | 24mm f/1.78 1/120s ISO100",
        "shotAt": "2024-01-01T10:00:00.000Z",
        "createdAt": "2024-01-01T10:00:00.000Z",
        "updatedAt": "2024-01-01T10:00:00.000Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  },
  "timestamp": 1703664000000
}
```

---

### 3. 照片管理

#### 3.1 获取照片详情

获取单张照片信息。**无需认证**。

**请求**

```
GET /api/v1/photos/:id
```

**响应示例**

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "id": 1,
    "albumId": 1,
    "originalFilename": "photo.jpg",
    "storedFilename": "abc123.jpg",
    "thumbnailFilename": "thumb_abc123.jpg",
    "mimeType": "image/jpeg",
    "width": 1920,
    "height": 1080,
    "displayName": "photo",
    "exifSummary": "iPhone 15 Pro | 24mm f/1.78 1/120s ISO100",
    "exifData": {
      "make": "Apple",
      "model": "iPhone 15 Pro",
      "focalLength": 24,
      "fNumber": 1.78,
      "exposureTime": "1/120",
      "iso": 100,
      "dateTime": "2024-01-01T10:00:00.000Z"
    },
    "shotAt": "2024-01-01T10:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  },
  "timestamp": 1703664000000
}
```

---

#### 3.2 上传照片

上传照片到指定相册。**需要认证**。

**请求**

```
POST /api/v1/photos/upload
Content-Type: multipart/form-data
```

**请求头**

```
Authorization: Bearer <token>
```

**表单字段**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| albumId | string | ✓ | 相册 ID |
| photos | file[] | ✓ | 照片文件（支持多个，最多 50 张） |

**支持的文件类型**

- image/jpeg
- image/png
- image/gif
- image/webp
- image/heic
- image/heif

**文件大小限制**: 默认 30MB（可配置）

**响应示例**

```json
{
  "code": 0,
  "message": "成功上传 3 张照片",
  "data": {
    "uploaded": 3,
    "failed": 1,
    "photos": [
      {
        "id": 1,
        "originalFilename": "photo1.jpg",
        "storedFilename": "abc123.jpg",
        "thumbnailFilename": "thumb_abc123.jpg"
      }
    ],
    "errors": [
      {
        "filename": "invalid.txt",
        "error": "不支持的文件类型"
      }
    ]
  },
  "timestamp": 1703664000000
}
```

---

#### 3.3 更新照片

更新照片信息或移动到其他相册。**需要认证**。

**请求**

```
PUT /api/v1/photos/:id
```

**请求头**

```
Authorization: Bearer <token>
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| albumId | number | ✗ | 移动到的目标相册 ID |
| originalFilename | string | ✗ | 新的文件名 |

**响应示例**

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "id": 1,
    "albumId": 2,
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": 1703664000000
}
```

---

#### 3.4 删除照片

删除照片及其文件。**需要认证**。

**请求**

```
DELETE /api/v1/photos/:id
```

**请求头**

```
Authorization: Bearer <token>
```

**响应示例**

```json
{
  "code": 0,
  "message": "删除成功",
  "data": {
    "id": 1
  },
  "timestamp": 1703664000000
}
```

---

### 4. 其他接口

#### 4.1 获取统计信息

获取系统统计数据。**无需认证**。

**请求**

```
GET /api/v1/stats
```

**响应示例**

```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "albumCount": 10,
    "photoCount": 500,
    "storageSize": 1073741824,
    "storageSizeFormatted": "1.00 GB"
  },
  "timestamp": 1703664000000
}
```

---

### 5. 静态资源

#### 5.1 获取原图

```
GET /api/uploads/originals/:filename
```

#### 5.2 获取缩略图

```
GET /api/uploads/thumbs/:filename
```

---

## 附录

### A. 数据类型定义

#### Album（相册）

```typescript
interface Album {
  id: number
  name: string
  description: string | null
  coverPhotoId: number | null
  coverThumb: string | null
  photoCount?: number
  createdAt: string  // ISO 8601 格式
  updatedAt: string  // ISO 8601 格式
}
```

#### Photo（照片）

```typescript
interface Photo {
  id: number
  albumId: number
  originalFilename: string
  storedFilename: string
  thumbnailFilename: string
  mimeType: string
  width: number | null
  height: number | null
  exifJson: string | null
  shotAt: string | null
  createdAt: string
  updatedAt: string
  displayName?: string
  exifSummary?: string
  exifData?: object
}
```

#### User（用户）

```typescript
interface User {
  id: number
  username: string
}
```

### B. 客户端实现建议

1. **Token 存储**: 使用安全存储（如 iOS Keychain, Android EncryptedSharedPreferences）保存 token
2. **Token 刷新**: 在 token 即将过期时（如剩余 1 天），自动调用刷新接口
3. **错误处理**: 收到 1004 错误码时，跳转到登录页面
4. **图片加载**: 
   - 列表使用缩略图：`/api/uploads/thumbs/{thumbnailFilename}`
   - 详情使用原图：`/api/uploads/originals/{storedFilename}`
5. **分页加载**: 实现上拉加载更多，建议 pageSize 为 20

### C. 更新日志

#### v1.0.0 (2024-12-27)

- 初始版本
- 支持 Bearer Token 认证
- 相册 CRUD 操作
- 照片上传、查看、删除
- 统一响应格式
