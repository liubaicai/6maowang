/**
 * 删除照片接口
 * DELETE /api/v1/photos/:id
 * 
 * 请求头:
 * - Authorization: Bearer <token>
 * 
 * 使用软删除，标记为已删除但保留数据
 */
import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { successResponse, errorResponse } from '../../../utils/api-response'
import { logOperation } from '../../../utils/operation-log'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    
    const id = getRouterParam(event, 'id')
    if (!id) {
      return errorResponse('照片 ID 不能为空', 3001)
    }
    
    // 获取照片信息
    const photo = db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.id, Number(id)))
      .get()
    
    if (!photo) {
      return errorResponse('照片不存在', 3002)
    }
    
    // 软删除：标记为已删除而不是物理删除
    db.update(schema.photos)
      .set({ 
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.photos.id, Number(id)))
      .run()
    
    // 如果该照片是相册封面，清除封面设置
    db.update(schema.albums)
      .set({ coverPhotoId: null })
      .where(eq(schema.albums.coverPhotoId, Number(id)))
      .run()
    
    // 记录操作日志
    logOperation(user.id, 'delete_photo', 'photo', Number(id), {
      filename: photo.originalFilename,
      albumId: photo.albumId,
    })
    
    return successResponse({ id: Number(id) }, '删除成功')
  } catch (error: any) {
    if (error.statusCode === 401) {
      return errorResponse(error.message, 1004)
    }
    return errorResponse(error.message || '删除失败', 3000)
  }
})
