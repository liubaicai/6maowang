import { join } from 'node:path'
import { existsSync, createReadStream, statSync } from 'node:fs'
import { uploadsDir } from '../../utils/paths'

// 支持的图片 MIME 类型
const mimeTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
}

export default defineEventHandler(async (event) => {
  // 获取路径参数，例如 originals/xxx.jpg 或 thumbs/xxx.jpg
  const path = getRouterParam(event, 'path')
  
  if (!path) {
    throw createError({
      statusCode: 400,
      message: '路径不能为空',
    })
  }

  // 安全检查：防止路径遍历攻击
  if (path.includes('..') || path.includes('\\')) {
    throw createError({
      statusCode: 400,
      message: '非法路径',
    })
  }

  // 只允许访问 originals 和 thumbs 目录
  if (!path.startsWith('originals/') && !path.startsWith('thumbs/')) {
    throw createError({
      statusCode: 403,
      message: '禁止访问',
    })
  }

  const filePath = join(uploadsDir, path)

  // 检查文件是否存在
  if (!existsSync(filePath)) {
    throw createError({
      statusCode: 404,
      message: '文件不存在',
    })
  }

  // 获取文件扩展名和 MIME 类型
  const ext = path.substring(path.lastIndexOf('.')).toLowerCase()
  const contentType = mimeTypes[ext] || 'application/octet-stream'

  // 获取文件信息用于缓存
  const stat = statSync(filePath)
  const etag = `"${stat.size}-${stat.mtime.getTime()}"`
  
  // 检查 If-None-Match 头（缓存验证）
  const ifNoneMatch = getRequestHeader(event, 'if-none-match')
  if (ifNoneMatch === etag) {
    setResponseStatus(event, 304)
    return null
  }

  // 设置响应头
  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Content-Length', stat.size)
  setResponseHeader(event, 'ETag', etag)
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable') // 1年缓存
  setResponseHeader(event, 'Last-Modified', stat.mtime.toUTCString())

  // 返回文件流
  return sendStream(event, createReadStream(filePath))
})
