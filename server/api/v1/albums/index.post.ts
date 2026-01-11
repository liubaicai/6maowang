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
 * - isPublic: 是否公开（可选，默认 true）
 */
import { db, schema } from '../../../database'
import { requireAuth } from '../../../utils/auth'
import { validateAlbumName } from '../../../utils/validators'
import { successResponse, errorResponse } from '../../../utils/api-response'
import { logOperation } from '../../../utils/operation-log'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    
    const body = await readBody(event)
    const { name, description, isPublic } = body
    
    // 验证相册名称
    const validation = validateAlbumName(name)
    if (!validation.valid) {
      return errorResponse(validation.error || '相册名称无效', 2003)
    }
    
    const now = new Date().toISOString()
    
    const result = db.insert(schema.albums).values({
      name: name.trim(),
      description: description?.trim() || '',
      isPublic: isPublic !== undefined ? (isPublic ? 1 : 0) : 1, // 默认公开
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    }).run()
    
    // 记录操作日志
    logOperation(user.id, 'create_album', 'album', Number(result.lastInsertRowid), {
      albumName: name.trim(),
    })
    
    return successResponse({
      id: Number(result.lastInsertRowid),
      name: name.trim(),
      description: description?.trim() || '',
      isPublic: isPublic !== undefined ? (isPublic ? 1 : 0) : 1,
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
