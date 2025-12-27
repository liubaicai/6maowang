/**
 * 删除照片接口
 * DELETE /api/v1/photos/:id
 * 
 * 请求头:
 * - Authorization: Bearer <token>
 */
import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { originalsDir, thumbsDir } from '../../../utils/paths'
import { successResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    
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
    
    // 删除文件
    try {
      rmSync(join(originalsDir, photo.storedFilename), { force: true })
      rmSync(join(thumbsDir, photo.thumbnailFilename), { force: true })
    } catch {
      // 忽略文件删除错误
    }
    
    // 删除数据库记录
    db.delete(schema.photos)
      .where(eq(schema.photos.id, Number(id)))
      .run()
    
    // 如果该照片是相册封面，清除封面设置
    db.update(schema.albums)
      .set({ coverPhotoId: null })
      .where(eq(schema.albums.coverPhotoId, Number(id)))
      .run()
    
    return successResponse({ id: Number(id) }, '删除成功')
  } catch (error: any) {
    if (error.statusCode === 401) {
      return errorResponse(error.message, 1004)
    }
    return errorResponse(error.message || '删除失败', 3000)
  }
})
