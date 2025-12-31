import { db, schema } from '../../../database'
import { desc, sql } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/auth'
import { getS3PublicUrl } from '../../../utils/s3'

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  await requireAdmin(event)

  // 获取查询参数
  const query = getQuery(event)
  const page = Math.max(parseInt(query.page as string) || 1, 1)
  const limit = Math.min(Math.max(parseInt(query.limit as string) || 20, 1), 100)
  const offset = (page - 1) * limit
  const showDeleted = query.showDeleted === 'true' || query.showDeleted === '1'

  try {
    // 构建查询条件
    let whereClause = sql`1=1`
    if (!showDeleted) {
      whereClause = sql`${schema.photos.deletedAt} IS NULL`
    }

    // 查询总数
    const countResult = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.photos)
      .where(whereClause)
      .get()
    
    const total = countResult?.count || 0

    // 查询照片列表（包括相册信息）
    const photos = db
      .select({
        id: schema.photos.id,
        albumId: schema.photos.albumId,
        albumName: schema.albums.name,
        originalFilename: schema.photos.originalFilename,
        storedFilename: schema.photos.storedFilename,
        thumbnailFilename: schema.photos.thumbnailFilename,
        mimeType: schema.photos.mimeType,
        width: schema.photos.width,
        height: schema.photos.height,
        shotAt: schema.photos.shotAt,
        isSlideshow: schema.photos.isSlideshow,
        s3OriginalUrl: schema.photos.s3OriginalUrl,
        s3ThumbnailUrl: schema.photos.s3ThumbnailUrl,
        deletedAt: schema.photos.deletedAt,
        createdAt: schema.photos.createdAt,
        updatedAt: schema.photos.updatedAt,
      })
      .from(schema.photos)
      .leftJoin(schema.albums, sql`${schema.photos.albumId} = ${schema.albums.id}`)
      .where(whereClause)
      .orderBy(desc(schema.photos.createdAt))
      .limit(limit)
      .offset(offset)
      .all()

    // 处理照片 URL
    const processedPhotos = await Promise.all(
      photos.map(async (photo) => {
        const thumbnailUrl = await getS3PublicUrl(photo.s3ThumbnailUrl) || `/api/uploads/thumbs/${photo.thumbnailFilename}`
        const originalUrl = await getS3PublicUrl(photo.s3OriginalUrl) || `/api/uploads/originals/${photo.storedFilename}`

        return {
          ...photo,
          thumbnailUrl,
          originalUrl,
          isDeleted: !!photo.deletedAt,
        }
      })
    )

    return {
      photos: processedPhotos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('获取照片列表失败:', error)
    throw createError({
      statusCode: 500,
      message: '获取照片列表失败',
    })
  }
})
