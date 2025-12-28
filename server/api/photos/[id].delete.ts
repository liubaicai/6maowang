import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { logOperation } from '../../utils/operation-log'

export default defineEventHandler(async (event) => {
  // 验证登录
  const user = await requireAuth(event)
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '照片 ID 不能为空',
    })
  }
  
  // 获取照片信息
  const photo = db
    .select()
    .from(schema.photos)
    .where(eq(schema.photos.id, Number(id)))
    .get()
  
  if (!photo) {
    throw createError({
      statusCode: 404,
      message: '照片不存在',
    })
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
  
  return { ok: true }
})
