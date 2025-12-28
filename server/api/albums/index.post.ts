import { db, schema } from '../../database'
import { requireAuth } from '../../utils/auth'
import { validateAlbumName } from '../../utils/validators'
import { logOperation } from '../../utils/operation-log'

export default defineEventHandler(async (event) => {
  // 验证登录
  const user = await requireAuth(event)
  
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
    createdBy: user.id,
    createdAt: now,
    updatedAt: now,
  }).run()
  
  // 记录操作日志
  logOperation(user.id, 'create_album', 'album', Number(result.lastInsertRowid), {
    albumName: name.trim(),
  })
  
  return {
    ok: true,
    id: result.lastInsertRowid,
  }
})
