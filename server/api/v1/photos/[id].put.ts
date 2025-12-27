/**
 * 更新照片接口
 * PUT /api/v1/photos/:id
 * 
 * 请求头:
 * - Authorization: Bearer <token>
 * 
 * 请求体:
 * - albumId: 移动到的相册 ID（可选）
 * - originalFilename: 新文件名（可选）
 */
import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { successResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    
    const id = getRouterParam(event, 'id')
    if (!id) {
      return errorResponse('照片 ID 不能为空', 3001)
    }
    
    // 检查照片是否存在
    const photo = db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.id, Number(id)))
      .get()
    
    if (!photo) {
      return errorResponse('照片不存在', 3002)
    }
    
    const body = await readBody(event)
    const { albumId, originalFilename } = body
    
    const now = new Date().toISOString()
    const updates: Record<string, any> = { updatedAt: now }
    
    // 移动到其他相册
    if (albumId !== undefined) {
      // 验证目标相册存在
      const targetAlbum = db
        .select()
        .from(schema.albums)
        .where(eq(schema.albums.id, Number(albumId)))
        .get()
      
      if (!targetAlbum) {
        return errorResponse('目标相册不存在', 2002)
      }
      
      updates.albumId = Number(albumId)
    }
    
    // 重命名
    if (originalFilename && typeof originalFilename === 'string') {
      updates.originalFilename = originalFilename.trim()
    }
    
    db.update(schema.photos)
      .set(updates)
      .where(eq(schema.photos.id, Number(id)))
      .run()
    
    return successResponse({
      id: Number(id),
      ...updates,
    }, '更新成功')
  } catch (error: any) {
    if (error.statusCode === 401) {
      return errorResponse(error.message, 1004)
    }
    return errorResponse(error.message || '更新失败', 3000)
  }
})
