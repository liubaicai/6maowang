import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

// 上传目录路径（存放在 data 目录，避免构建时复制）
export const uploadsDir = join(process.cwd(), 'data', 'uploads')
export const originalsDir = join(uploadsDir, 'originals')
export const thumbsDir = join(uploadsDir, 'thumbs')

// 确保上传目录存在
export function ensureUploadDirs() {
  const dirs = [uploadsDir, originalsDir, thumbsDir]
  
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
      console.log(`📁 创建目录: ${dir}`)
    }
  }
}

// 获取原图 URL（通过 API 路由提供）
export function getOriginalUrl(filename: string): string {
  return `/api/uploads/originals/${filename}`
}

// 获取缩略图 URL（通过 API 路由提供）
export function getThumbUrl(filename: string): string {
  return `/api/uploads/thumbs/${filename}`
}
