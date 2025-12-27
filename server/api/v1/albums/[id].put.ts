/**
 * 更新相册接口
 * PUT /api/v1/albums/:id
 * 
 * 请求头:
 * - Authorization: Bearer <token>
 * 
 * 请求体:
 * - name: 相册名称（必填）
 * - description: 相册描述（可选）
 */
import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { validateAlbumName } from '../../../utils/validators'
import { successResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    
    const id = getRouterParam(event, 'id')
    if (!id) {
      return errorResponse('相册 ID 不能为空', 2001)
    }
    
    // 检查相册是否存在
    const existing = db
      .select()
      .from(schema.albums)
      .where(eq(schema.albums.id, Number(id)))
      .get()
    
    if (!existing) {
      return errorResponse('相册不存在', 2002)
    }
    
    const body = await readBody(event)
    const { name, description } = body
    
    // 验证相册名称
    const validation = validateAlbumName(name)
    if (!validation.valid) {
      return errorResponse(validation.error || '相册名称无效', 2003)
    }
    
    const now = new Date().toISOString()
    
    db.update(schema.albums)
      .set({
        name: name.trim(),
        description: description?.trim() || '',
        updatedAt: now,
      })
      .where(eq(schema.albums.id, Number(id)))
      .run()
    
    return successResponse({
      id: Number(id),
      name: name.trim(),
      description: description?.trim() || '',
      updatedAt: now,
    }, '更新成功')
  } catch (error: any) {
    if (error.statusCode === 401) {
      return errorResponse(error.message, 1004)
    }
    return errorResponse(error.message || '更新失败', 2000)
  }
})
