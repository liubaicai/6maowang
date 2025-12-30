/**
 * 获取随机照片接口
 * GET /api/v1/photos/random?count=10
 * 
 * 公开接口，无需认证
 * 
 * @param count - 获取照片数量，默认 1，最大 50
 */
import { db, schema } from '../../../database'
import { isNull, sql } from 'drizzle-orm'
import { getS3PublicUrl } from '../../../utils/s3'
import { successResponse, errorResponse } from '../../../utils/api-response'

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
      return successResponse([], '没有可用的照片')
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

    return successResponse(processedPhotos, '获取成功')
  } catch (error: any) {
    return errorResponse(error.message || '获取随机照片失败', 3100)
  }
})
