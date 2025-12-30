import { requireAuth } from '../../../utils/auth'
import { logOperation } from '../../../utils/operation-log'
import { db, schema } from '../../../database'

// 重置所有照片的 S3 字段，切换为本地存储
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  // 只有管理员可以执行此操作
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '无权限执行此操作',
    })
  }
  
  try {
    // 统计将被重置的记录数
    const photosWithS3 = db
      .select()
      .from(schema.photos)
      .all()
      .filter(p => p.s3OriginalUrl || p.s3ThumbnailUrl)
    
    const count = photosWithS3.length
    
    if (count === 0) {
      return {
        ok: true,
        message: '没有需要重置的记录',
        count: 0,
      }
    }
    
    // 清理所有照片的 S3 字段
    const now = new Date().toISOString()
    db.update(schema.photos)
      .set({
        s3OriginalUrl: null,
        s3ThumbnailUrl: null,
        s3UploadedAt: null,
        updatedAt: now,
      })
      .run()
    
    // 记录操作日志
    logOperation(user.id, 'reset_s3_fields', 'photo', undefined, {
      resetCount: count,
    })
    
    return {
      ok: true,
      message: `已重置 ${count} 张照片的 S3 信息，将使用本地存储`,
      count,
    }
  } catch (error: any) {
    console.error('重置 S3 字段失败:', error)
    throw createError({
      statusCode: 500,
      message: error.message || '重置失败',
    })
  }
})
