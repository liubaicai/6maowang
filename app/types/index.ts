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
