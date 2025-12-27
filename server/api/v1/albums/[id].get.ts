/**
 * 获取相册详情接口
 * GET /api/v1/albums/:id
 * 
 * 公开接口，无需认证
 */
import { db, schema } from '../../../database'
import { eq, count } from 'drizzle-orm'
import { successResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      return errorResponse('相册 ID 不能为空', 2001)
    }
    
    const album = db
      .select()
      .from(schema.albums)
      .where(eq(schema.albums.id, Number(id)))
      .get()
    
    if (!album) {
      return errorResponse('相册不存在', 2002)
    }
    
    // 获取照片数量
    const photoCount = db
      .select({ count: count() })
      .from(schema.photos)
      .where(eq(schema.photos.albumId, Number(id)))
      .get()?.count || 0
    
    // 获取封面信息
    let coverThumb: string | null = null
    if (album.coverPhotoId) {
      const photo = db
        .select({ thumbnailFilename: schema.photos.thumbnailFilename })
        .from(schema.photos)
        .where(eq(schema.photos.id, album.coverPhotoId))
        .get()
      coverThumb = photo?.thumbnailFilename || null
    }
    
    return successResponse({
      ...album,
      coverThumb,
      photoCount,
    }, '获取成功')
  } catch (error: any) {
    return errorResponse(error.message || '获取失败', 2000)
  }
})
