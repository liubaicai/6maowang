import { db, schema } from '../../../database'
import { eq, desc, isNull, and } from 'drizzle-orm'
import { formatExifSummary } from '../../../utils/image'
import { getS3PublicUrl } from '../../../utils/s3'

export default defineEventHandler(async (event) => {
  const albumId = getRouterParam(event, 'albumId')
  
  if (!albumId) {
    throw createError({
      statusCode: 400,
      message: '相册 ID 不能为空',
    })
  }
  
  // 获取照片列表（排除软删除的照片）
  const photos = db
    .select()
    .from(schema.photos)
    .where(and(
      eq(schema.photos.albumId, Number(albumId)),
      isNull(schema.photos.deletedAt)
    ))
    .orderBy(desc(schema.photos.createdAt))
    .all()
  
  // 格式化返回数据
  const result = photos.map((photo) => {
    // 显示名称（去除扩展名）
    const displayName = photo.originalFilename.replace(/\.[^.]+$/, '')
    
    // 解析 EXIF 并格式化摘要
    let exifSummary = ''
    try {
      const exif = photo.exifJson ? JSON.parse(photo.exifJson) : null
      if (exif) {
        // 兼容大写（旧数据）和小写（新数据）字段名
        exifSummary = formatExifSummary({
          make: exif.Make || exif.make,
          model: exif.Model || exif.model,
          focalLength: exif.FocalLength || exif.focalLength,
          fNumber: exif.FNumber || exif.fNumber,
          exposureTime: exif.ExposureTime || exif.exposureTime,
          iso: exif.ISO || exif.iso,
        })
      }
    } catch {
      // 忽略解析错误
    }
    
    // 优先使用 S3 URL（如果有），数据库存储的是相对路径，需要拼接 publicUrl
    const originalUrl = getS3PublicUrl(photo.s3OriginalUrl) || `/api/uploads/originals/${photo.storedFilename}`
    const thumbnailUrl = getS3PublicUrl(photo.s3ThumbnailUrl) || `/api/uploads/thumbs/${photo.thumbnailFilename}`
    
    return {
      ...photo,
      displayName,
      exifSummary,
      originalUrl,
      thumbnailUrl,
      hasS3: !!photo.s3OriginalUrl,
    }
  })
  
  return result
})
