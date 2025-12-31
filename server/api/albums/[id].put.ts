import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { validateAlbumName } from '../../utils/validators'

export default defineEventHandler(async (event) => {
  // 验证登录
  await requireAuth(event)
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '相册 ID 不能为空',
    })
  }
  
  const body = await readBody(event)
  const { name, description, isPublic } = body
  
  // 验证相册名称
  const validation = validateAlbumName(name)
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      message: validation.error,
    })
  }
  
  const now = new Date().toISOString()
  
  const updateData: Record<string, any> = {
    name: name.trim(),
    description: description?.trim() || '',
    updatedAt: now,
  }
  
  // 只有明确传递了 isPublic 时才更新
  if (typeof isPublic === 'boolean') {
    updateData.isPublic = isPublic ? 1 : 0
  }
  
  db.update(schema.albums)
    .set(updateData)
    .where(eq(schema.albums.id, Number(id)))
    .run()
  
  return { ok: true }
})
