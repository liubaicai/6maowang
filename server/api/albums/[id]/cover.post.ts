import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'

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
  const { photoId } = body
  
  if (!photoId) {
    throw createError({
      statusCode: 400,
      message: '照片 ID 不能为空',
    })
  }
  
  // 验证照片是否属于该相册
  const photo = db
    .select()
    .from(schema.photos)
    .where(eq(schema.photos.id, Number(photoId)))
    .get()
  
  if (!photo || photo.albumId !== Number(id)) {
    throw createError({
      statusCode: 400,
      message: '照片不属于该相册',
    })
  }
  
  // 更新封面
  db.update(schema.albums)
    .set({
      coverPhotoId: Number(photoId),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(schema.albums.id, Number(id)))
    .run()
  
  return { ok: true }
})
