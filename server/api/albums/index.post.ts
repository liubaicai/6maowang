import { db, schema } from '../../database'
import { requireAuth } from '../../utils/auth'
import { validateAlbumName } from '../../utils/validators'

export default defineEventHandler(async (event) => {
  // 验证登录
  await requireAuth(event)
  
  const body = await readBody(event)
  const { name, description } = body
  
  // 验证相册名称
  const validation = validateAlbumName(name)
  if (!validation.valid) {
    throw createError({
      statusCode: 400,
      message: validation.error,
    })
  }
  
  const now = new Date().toISOString()
  
  const result = db.insert(schema.albums).values({
    name: name.trim(),
    description: description?.trim() || '',
    createdAt: now,
    updatedAt: now,
  }).run()
  
  return {
    ok: true,
    id: result.lastInsertRowid,
  }
})
