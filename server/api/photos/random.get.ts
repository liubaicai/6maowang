import { db, schema } from '../../database'
import { isNull, sql } from 'drizzle-orm'
import { getS3PublicUrl } from '../../utils/s3'

export default defineEventHandler(async (event) => {
  try {
    // 获取查询参数
    const query = getQuery(event)
    const count = Math.min(Math.max(parseInt(query.count as string) || 1, 1), 50) // 限制在 1-50 张之间

    // 查询所有未删除的照片，使用 RANDOM() 排序
    const photos = db
      .select()
      .from(schema.photos)
      .where(isNull(schema.photos.deletedAt))
      .orderBy(sql`RANDOM()`)
      .limit(count)
      .all()

    if (!photos || photos.length === 0) {
      return []
    }

    // 处理每张照片的 URL
    const processedPhotos = await Promise.all(
      photos.map(async (photo) => {
        // 优先使用 S3 URL，否则使用本地路径
        const originalUrl = await getS3PublicUrl(photo.s3OriginalUrl) || `/api/uploads/originals/${photo.storedFilename}`
        const thumbnailUrl = await getS3PublicUrl(photo.s3ThumbnailUrl) || `/api/uploads/thumbs/${photo.thumbnailFilename}`

        return {
          id: photo.id,
          albumId: photo.albumId,
          originalFilename: photo.originalFilename,
          width: photo.width,
          height: photo.height,
          shotAt: photo.shotAt,
          originalUrl,
          thumbnailUrl,
          hasS3: !!photo.s3OriginalUrl,
        }
      })
    )

    return processedPhotos
  } catch (error) {
    console.error('Failed to get random photos:', error)
    throw createError({
      statusCode: 500,
      message: '获取随机照片失败',
    })
  }
})
