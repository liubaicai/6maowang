/**
 * 获取统计信息接口
 * GET /api/v1/stats
 * 
 * 公开接口，无需认证
 */
import { db, schema } from '../../database'
import { count } from 'drizzle-orm'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { originalsDir, thumbsDir } from '../../utils/paths'
import { successResponse, errorResponse } from '../../utils/api-response'

export default defineEventHandler(async () => {
  try {
    // 统计相册数
    const albumCount = db
      .select({ count: count() })
      .from(schema.albums)
      .get()?.count || 0
    
    // 统计照片数
    const photoCount = db
      .select({ count: count() })
      .from(schema.photos)
      .get()?.count || 0
    
    // 计算存储占用
    let storageSize = 0
    
    try {
      // 原图
      const originals = readdirSync(originalsDir)
      for (const file of originals) {
        const stat = statSync(join(originalsDir, file))
        storageSize += stat.size
      }
      
      // 缩略图
      const thumbs = readdirSync(thumbsDir)
      for (const file of thumbs) {
        const stat = statSync(join(thumbsDir, file))
        storageSize += stat.size
      }
    } catch {
      // 目录不存在时忽略
    }
    
    // 格式化存储大小
    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
      return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
    }
    
    return successResponse({
      albumCount,
      photoCount,
      storageSize,
      storageSizeFormatted: formatSize(storageSize),
    }, '获取成功')
  } catch (error: any) {
    return errorResponse(error.message || '获取失败', 4000)
  }
})
