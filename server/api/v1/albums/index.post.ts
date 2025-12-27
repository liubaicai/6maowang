/**
 * 创建相册接口
 * POST /api/v1/albums
 * 
 * 请求头:
 * - Authorization: Bearer <token>
 * 
 * 请求体:
 * - name: 相册名称（必填）
 * - description: 相册描述（可选）
 */
import { db, schema } from '../../../database'
import { requireAuth } from '../../../utils/auth'
import { validateAlbumName } from '../../../utils/validators'
import { successResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    await requireAuth(event)
    
    const body = await readBody(event)
    const { name, description } = body
    
    // 验证相册名称
    const validation = validateAlbumName(name)
    if (!validation.valid) {
      return errorResponse(validation.error || '相册名称无效', 2003)
    }
    
    const now = new Date().toISOString()
    
    const result = db.insert(schema.albums).values({
      name: name.trim(),
      description: description?.trim() || '',
      createdAt: now,
      updatedAt: now,
    }).run()
    
    return successResponse({
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      description: description?.trim() || '',
      createdAt: now,
      updatedAt: now,
    }, '创建成功')
  } catch (error: any) {
    if (error.statusCode === 401) {
      return errorResponse(error.message, 1004)
    }
    return errorResponse(error.message || '创建失败', 2000)
  }
})
