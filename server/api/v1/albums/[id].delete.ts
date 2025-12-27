/**
 * 删除相册接口
 * DELETE /api/v1/albums/:id
 * 
 * 请求头:
 * - Authorization: Bearer <token>
 * 
 * 会同时删除相册内所有照片文件
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
      return errorResponse('相册 ID 不能为空', 2001)
    }
    
    // 检查相册是否存在
    const album = db
      .select()
      .from(schema.albums)
      .where(eq(schema.albums.id, Number(id)))
      .get()
    
    if (!album) {
      return errorResponse('相册不存在', 2002)
    }
    
    // 获取相册内所有照片
    const photos = db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.albumId, Number(id)))
      .all()
    
    // 删除照片文件
    for (const photo of photos) {
      try {
        rmSync(join(originalsDir, photo.storedFilename), { force: true })
        rmSync(join(thumbsDir, photo.thumbnailFilename), { force: true })
      } catch {
        // 忽略文件删除错误
      }
    }
    
    // 删除相册（照片会级联删除）
    db.delete(schema.albums)
      .where(eq(schema.albums.id, Number(id)))
      .run()
    
    return successResponse({ id: Number(id) }, '删除成功')
  } catch (error: any) {
    if (error.statusCode === 401) {
      return errorResponse(error.message, 1004)
    }
    return errorResponse(error.message || '删除失败', 2000)
  }
})
