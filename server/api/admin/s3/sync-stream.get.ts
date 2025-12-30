import { requireAuth } from '../../../utils/auth'
import { getS3Config, checkS3ObjectExists, uploadPhotoToS3 } from '../../../utils/s3'
import { logOperation } from '../../../utils/operation-log'
import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { originalsDir } from '../../../utils/paths'

// 同步本地照片到 S3（带进度推送）
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  // 只有管理员可以执行同步
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '无权限执行此操作',
    })
  }
  
  const config = getS3Config()
  
  if (!config.enabled) {
    throw createError({
      statusCode: 400,
      message: 'S3 未启用，请先配置并启用 S3',
    })
  }
  
  // 设置 SSE 响应头
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })
  
  const sendEvent = (data: any) => {
    event.node.res.write(`data: ${JSON.stringify(data)}\n\n`)
  }
  
  // 查询所有照片（排除已删除的）
  const photos = db
    .select()
    .from(schema.photos)
    .all()
    .filter(p => !p.deletedAt)

  const total = photos.length
  
  if (total === 0) {
    sendEvent({
      type: 'complete',
      message: '没有照片需要同步',
      synced: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    })
    event.node.res.end()
    return
  }
  
  let synced = 0
  let failed = 0
  let skipped = 0
  const errors: string[] = []
  
  // 发送开始事件
  sendEvent({
    type: 'start',
    total,
    message: `开始同步 ${total} 张照片...`,
  })
  
  // 批处理大小 - 减少并发以避免文件描述符耗尽
  const batchSize = 3
  
  for (let i = 0; i < photos.length; i += batchSize) {
    const batch = photos.slice(i, i + batchSize)
    
    for (let j = 0; j < batch.length; j++) {
      const photo = batch[j]
      const currentIndex = i + j
      
      // 发送进度事件
      sendEvent({
        type: 'progress',
        current: currentIndex + 1,
        total,
        filename: photo.originalFilename,
        percent: Math.round(((currentIndex + 1) / total) * 100),
      })
      
      try {
        // 先检查本地原图是否存在
        const localOriginalPath = join(originalsDir, photo.storedFilename)
        if (!existsSync(localOriginalPath)) {
          skipped++
          continue
        }
        
        // 检测 S3 上是否已存在原图
        const originalKey = `originals/${photo.storedFilename}`
        const exists = await checkS3ObjectExists(config, originalKey)
        
        if (exists) {
          // S3 上已存在，跳过上传但确保数据库有相对路径
          if (!photo.s3OriginalUrl) {
            const now = new Date().toISOString()
            const thumbKey = `thumbs/${photo.thumbnailFilename}`
            db.update(schema.photos)
              .set({
                s3OriginalUrl: originalKey,
                s3ThumbnailUrl: thumbKey,
                s3UploadedAt: now,
                updatedAt: now,
              })
              .where(eq(schema.photos.id, photo.id))
              .run()
          }
          skipped++
          continue
        }
        
        // S3 上不存在，执行上传
        const result = await uploadPhotoToS3(
          photo.storedFilename,
          photo.thumbnailFilename,
          photo.mimeType
        )

        if (result.originalUrl) {
          const now = new Date().toISOString()
          db.update(schema.photos)
            .set({
              s3OriginalUrl: result.originalUrl,
              s3ThumbnailUrl: result.thumbnailUrl,
              s3UploadedAt: now,
              updatedAt: now,
            })
            .where(eq(schema.photos.id, photo.id))
            .run()
          
          synced++
        } else {
          failed++
          errors.push(`${photo.storedFilename}: 上传失败`)
        }
      } catch (error: any) {
        failed++
        errors.push(`${photo.storedFilename}: ${error.message}`)
        console.error(`上传到 S3 失败 (${photo.storedFilename}):`, error.message)
      }
    }
    
    // 每批处理完后等待 200ms，让系统回收资源
    if (i + batchSize < photos.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }
  
  // 记录操作日志
  logOperation(user.id, 'sync_photos_to_s3', 'photo', undefined, {
    synced,
    failed,
    skipped,
    errors: errors.slice(0, 10),
  })
  
  // 构建消息
  let message = ''
  if (synced === 0 && skipped > 0 && failed === 0) {
    message = `所有 ${skipped} 张照片已在 S3 中`
  } else if (failed > 0) {
    message = `同步完成：新上传 ${synced} 张，已存在 ${skipped} 张，失败 ${failed} 张`
  } else {
    message = `同步完成：新上传 ${synced} 张，已存在 ${skipped} 张`
  }
  
  // 发送完成事件
  sendEvent({
    type: 'complete',
    message,
    synced,
    failed,
    skipped,
    total,
    errors: errors.slice(0, 10),
  })
  
  event.node.res.end()
})
