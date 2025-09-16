import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // 验证登录
  await requireAuth(event)
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '照片 ID 不能为空',
    })
  }
  
  const body = await readBody(event)
  const { albumId, originalFilename } = body
  
  const now = new Date().toISOString()
  const updates: Record<string, any> = { updatedAt: now }
  
  // 移动到其他相册
  if (albumId !== undefined) {
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
  
  return { ok: true }
})
