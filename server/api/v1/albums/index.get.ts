/**
 * 获取相册列表接口
 * GET /api/v1/albums
 * 
 * 查询参数:
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20）
 * 
 * 公开接口，无需认证，但只返回公开相册
 * 已登录用户可以看到所有相册（包括私有）
 */
import { db, schema } from '../../../database'
import { eq, desc, count } from 'drizzle-orm'
import { successResponse, paginatedResponse, errorResponse } from '../../../utils/api-response'
import { getOptionalAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // 获取当前用户（可选）
    const user = await getOptionalAuth(event)
    
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
    const offset = (page - 1) * pageSize
    
    // 构建查询条件：未登录时只显示公开相册
    const whereCondition = user ? undefined : eq(schema.albums.isPublic, 1)
    
    // 获取总数
    const totalResult = whereCondition
      ? db.select({ count: count() }).from(schema.albums).where(whereCondition).get()
      : db.select({ count: count() }).from(schema.albums).get()
    const total = totalResult?.count || 0
    
    // 获取相册列表
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
      .limit(pageSize)
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
      
      // 获取照片数量
      const photoCount = db
        .select({ count: count() })
        .from(schema.photos)
        .where(eq(schema.photos.albumId, album.id))
        .get()?.count || 0
      
      return {
        ...album,
        coverThumb,
        photoCount,
      }
    })
    
    return paginatedResponse(result, total, page, pageSize, '获取成功')
  } catch (error: any) {
    return errorResponse(error.message || '获取失败', 2000)
  }
})
