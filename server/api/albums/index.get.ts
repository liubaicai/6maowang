import { db, schema } from '../../database'
import { eq, desc, count, sql, and } from 'drizzle-orm'
import { getOptionalAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // 获取当前用户（可选）
  const user = await getOptionalAuth(event)
  
  const query = getQuery(event)
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string) || 10))
  const offset = (page - 1) * limit
  
  // 构建查询条件：未登录时只显示公开相册
  const whereCondition = user ? undefined : eq(schema.albums.isPublic, 1)
  
  // 获取总数
  const totalResult = whereCondition
    ? db.select({ count: count() }).from(schema.albums).where(whereCondition).get()
    : db.select({ count: count() }).from(schema.albums).get()
  const total = totalResult?.count || 0
  
  // 获取相册列表，包含封面信息
  const albumsQuery = db
    .select({
      id: schema.albums.id,
      name: schema.albums.name,
      description: schema.albums.description,
      coverPhotoId: schema.albums.coverPhotoId,
      isPublic: schema.albums.isPublic,
      createdAt: schema.albums.createdAt,
      updatedAt: schema.albums.updatedAt,
    })
    .from(schema.albums)
    .orderBy(desc(schema.albums.updatedAt))
    .limit(limit)
    .offset(offset)
  
  const albums = whereCondition
    ? albumsQuery.where(whereCondition).all()
    : albumsQuery.all()
  
  // 获取封面缩略图和照片数量
  const result = albums.map((album) => {
    let coverThumb: string | null = null
    
    if (album.coverPhotoId) {
      const photo = db
        .select({ thumbnailFilename: schema.photos.thumbnailFilename })
        .from(schema.photos)
        .where(eq(schema.photos.id, album.coverPhotoId))
        .get()
      
      coverThumb = photo?.thumbnailFilename || null
    }
    
    // 获取相册内的照片数量（不包括已删除的）
    const photoCountResult = db
      .select({ count: count() })
      .from(schema.photos)
      .where(sql`${schema.photos.albumId} = ${album.id} AND ${schema.photos.deletedAt} IS NULL`)
      .get()
    
    return {
      ...album,
      coverThumb,
      photoCount: photoCountResult?.count || 0,
    }
  })
  
  return {
    albums: result,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})
