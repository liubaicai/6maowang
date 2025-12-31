import { db, schema } from '../../../../database'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../../utils/auth'
import { logOperation } from '../../../../utils/operation-log'
import { getS3Config } from '../../../../utils/s3'
import { createStorageProvider } from '../../../../utils/storage'
import { unlinkSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { originalsDir, thumbsDir } from '../../../../utils/paths'

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  const user = await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '照片 ID 不能为空',
    })
  }

  // 获取照片信息
  const photo = db
    .select()
    .from(schema.photos)
    .where(eq(schema.photos.id, Number(id)))
    .get()

  if (!photo) {
    throw createError({
      statusCode: 404,
      message: '照片不存在',
    })
  }

  // 只能清理已删除的照片
  if (!photo.deletedAt) {
    throw createError({
      statusCode: 400,
      message: '只能清理已删除的照片',
    })
  }

  const errors: string[] = []

  try {
    // 删除本地原图
    const originalPath = join(originalsDir, photo.storedFilename)
    if (existsSync(originalPath)) {
      try {
        unlinkSync(originalPath)
      } catch (e: any) {
        errors.push(`删除本地原图失败: ${e.message}`)
      }
    }

    // 删除本地缩略图
    const thumbPath = join(thumbsDir, photo.thumbnailFilename)
    if (existsSync(thumbPath)) {
      try {
        unlinkSync(thumbPath)
      } catch (e: any) {
        errors.push(`删除本地缩略图失败: ${e.message}`)
      }
    }

    // 删除 S3 文件
    const s3Config = getS3Config()
    if (s3Config.enabled) {
      try {
        const provider = createStorageProvider(s3Config)
        
        // 删除 S3 原图
        if (photo.s3OriginalUrl) {
          const originalKey = photo.s3OriginalUrl.startsWith('originals/') 
            ? photo.s3OriginalUrl 
            : `originals/${photo.storedFilename}`
          await provider.deleteObject(originalKey)
        }

        // 删除 S3 缩略图
        if (photo.s3ThumbnailUrl) {
          const thumbKey = photo.s3ThumbnailUrl.startsWith('thumbs/') 
            ? photo.s3ThumbnailUrl 
            : `thumbs/${photo.thumbnailFilename}`
          await provider.deleteObject(thumbKey)
        }
      } catch (e: any) {
        errors.push(`删除 S3 文件失败: ${e.message}`)
      }
    }

    // 从数据库中彻底删除记录
    db.delete(schema.photos)
      .where(eq(schema.photos.id, Number(id)))
      .run()

    // 记录操作日志
    logOperation(user.id, 'cleanup_photo', 'photo', Number(id), {
      filename: photo.originalFilename,
      albumId: photo.albumId,
      errors: errors.length > 0 ? errors : undefined,
    })

    return {
      ok: true,
      message: errors.length > 0 ? '已清理（部分操作失败）' : '已彻底清理',
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    console.error('清理照片失败:', error)
    throw createError({
      statusCode: 500,
      message: `清理照片失败: ${error.message}`,
    })
  }
})
