// 相册类型
export interface Album {
  id: number
  name: string
  description: string | null
  coverPhotoId: number | null
  coverThumb: string | null
  createdAt: string
  updatedAt: string
  photoCount?: number
}

// 照片类型
export interface Photo {
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
  exifData?: ExifData
}

// EXIF 数据类型
export interface ExifData {
  make?: string
  model?: string
  focalLength?: number
  fNumber?: number
  exposureTime?: string
  iso?: number
  dateTime?: string
  [key: string]: any
}

// 用户类型
export interface User {
  id: number
  username: string
}

// 会话类型
export interface Session {
  authenticated: boolean
  user: User | null
}

// 统计类型
export interface Stats {
  albumCount: number
  photoCount: number
  storageSize: number
  storageSizeFormatted: string
}

// ============ API 响应类型 ============

// 统一 API 响应格式
export interface ApiResponse<T = any> {
  code: number        // 业务状态码：0 表示成功，其他表示错误
  message: string     // 消息描述
  data: T | null      // 响应数据
  timestamp: number   // 响应时间戳
}

// 分页数据
export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 登录响应
export interface LoginResponse {
  token: string
  expiresAt: string
  user: User
}

// Token 刷新响应
export interface RefreshTokenResponse {
  token: string
  expiresAt: string
  user: User
}

// 上传响应
export interface UploadResponse {
  uploaded: number
  failed: number
  photos: {
    id: number
    originalFilename: string
    storedFilename: string
    thumbnailFilename: string
  }[]
  errors: {
    filename: string
    error: string
  }[]
}
