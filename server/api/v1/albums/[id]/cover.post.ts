/**
 * 设置相册封面接口
 * POST /api/v1/albums/:id/cover
 * 
 * 请求头:
 * - Authorization: Bearer <token>
 * 
 * 请求体:
 * - photoId: 照片 ID
 */
import { db, schema } from '../../../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../../utils/auth'
import { successResponse, errorResponse } from '../../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    
    const id = getRouterParam(event, 'id')
    if (!id) {
      return errorResponse('相册 ID 不能为空', 2001)
    }
    
    const body = await readBody(event)
    const { photoId } = body
    
    if (!photoId) {
      return errorResponse('照片 ID 不能为空', 3001)
    }
    
    // 验证照片是否属于该相册
    const photo = db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.id, Number(photoId)))
      .get()
    
    if (!photo || photo.albumId !== Number(id)) {
      return errorResponse('照片不属于该相册', 2004)
    }
    
    // 更新封面
    db.update(schema.albums)
      .set({
        coverPhotoId: Number(photoId),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.albums.id, Number(id)))
      .run()
    
    return successResponse({
      albumId: Number(id),
      coverPhotoId: Number(photoId),
    }, '设置成功')
  } catch (error: any) {
    if (error.statusCode === 401) {
      return errorResponse(error.message, 1004)
    }
    return errorResponse(error.message || '设置失败', 2000)
  }
})
