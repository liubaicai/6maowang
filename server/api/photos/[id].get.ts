import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'
import { formatExifSummary } from '../../utils/image'
import { getS3PublicUrl } from '../../utils/s3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '照片 ID 不能为空',
    })
  }
  
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
  
  // 显示名称
  const displayName = photo.originalFilename.replace(/\.[^.]+$/, '')
  
  // 解析 EXIF
  let exifSummary = ''
  let exifData = null
  try {
    exifData = photo.exifJson ? JSON.parse(photo.exifJson) : null
    if (exifData) {
      exifSummary = formatExifSummary({
        make: exifData.make,
        model: exifData.model,
        focalLength: exifData.focalLength,
        fNumber: exifData.fNumber,
        exposureTime: exifData.exposureTime,
        iso: exifData.iso,
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
    exifData,
    originalUrl,
    thumbnailUrl,
    hasS3: !!photo.s3OriginalUrl,
  }
})
