import { requireAuth } from '../../../utils/auth'
import { syncPhotosToS3, getS3Config } from '../../../utils/s3'
import { logOperation } from '../../../utils/operation-log'
import { db, schema } from '../../../database'

// 同步本地照片到 S3
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
  
  // 查询所有照片数量（排除已删除的）
  const totalPhotos = db
    .select()
    .from(schema.photos)
    .all()
    .filter(p => !p.deletedAt)
    .length
  
  if (totalPhotos === 0) {
    return {
      ok: true,
      message: '没有照片需要同步',
      synced: 0,
      failed: 0,
      skipped: 0,
      total: 0,
    }
  }
  
  // 执行同步（会检测 S3 是否存在文件）
  const result = await syncPhotosToS3()
  
  // 记录操作日志
  logOperation(user.id, 'sync_photos_to_s3', 'photo', undefined, {
    synced: result.synced,
    failed: result.failed,
    skipped: result.skipped,
    errors: result.errors.slice(0, 10),
  })
  
  // 构建消息
  let message = ''
  if (result.synced === 0 && result.skipped > 0 && result.failed === 0) {
    message = `所有 ${result.skipped} 张照片已在 S3 中`
  } else if (result.failed > 0) {
    message = `同步完成：新上传 ${result.synced} 张，已存在 ${result.skipped} 张，失败 ${result.failed} 张`
  } else {
    message = `同步完成：新上传 ${result.synced} 张，已存在 ${result.skipped} 张`
  }
  
  return {
    ok: true,
    message,
    synced: result.synced,
    failed: result.failed,
    skipped: result.skipped,
    total: totalPhotos,
    errors: result.errors.slice(0, 10),
  }
})
