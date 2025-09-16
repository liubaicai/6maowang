import { extname } from 'node:path'

// 允许的图片 MIME 类型
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]

// 允许的文件扩展名
const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
]

/**
 * 验证文件类型
 */
export function validateImageFile(
  filename: string,
  mimeType: string
): { valid: boolean; error?: string } {
  // 验证 MIME 类型
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `不支持的文件类型: ${mimeType}，仅支持 JPG/PNG/WebP/GIF`,
    }
  }
  
  // 验证扩展名
  const ext = extname(filename).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `不支持的文件扩展名: ${ext}`,
    }
  }
  
  // 防止路径遍历攻击
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return {
      valid: false,
      error: '文件名包含非法字符',
    }
  }
  
  return { valid: true }
}

/**
 * 验证相册名称
 */
export function validateAlbumName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: '相册名称不能为空' }
  }
  
  const trimmed = name.trim()
  if (trimmed.length === 0) {
    return { valid: false, error: '相册名称不能为空' }
  }
  
  if (trimmed.length > 100) {
    return { valid: false, error: '相册名称不能超过 100 个字符' }
  }
  
  return { valid: true }
}

/**
 * 验证密码
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: '密码不能为空' }
  }
  
  if (password.length < 4) {
    return { valid: false, error: '密码长度至少 4 个字符' }
  }
  
  if (password.length > 100) {
    return { valid: false, error: '密码长度不能超过 100 个字符' }
  }
  
  return { valid: true }
}
