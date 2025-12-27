/**
 * 获取相册列表接口
 * GET /api/v1/albums
 * 
 * 查询参数:
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20）
 * 
 * 公开接口，无需认证
 */
import { db, schema } from '../../../database'
import { eq, desc, count } from 'drizzle-orm'
import { successResponse, paginatedResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
    const offset = (page - 1) * pageSize
    
    // 获取总数
    const totalResult = db
      .select({ count: count() })
      .from(schema.albums)
      .get()
    const total = totalResult?.count || 0
    
    // 获取相册列表
    const albums = db
      .select({
        id: schema.albums.id,
        name: schema.albums.name,
        description: schema.albums.description,
        coverPhotoId: schema.albums.coverPhotoId,
        createdAt: schema.albums.createdAt,
        updatedAt: schema.albums.updatedAt,
      })
      .from(schema.albums)
      .orderBy(desc(schema.albums.updatedAt))
      .limit(pageSize)
      .offset(offset)
      .all()
    
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
