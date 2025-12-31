import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../utils/auth'
import { logOperation } from '../../utils/operation-log'

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  const user = await requireAdmin(event)
  
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '相册 ID 不能为空',
    })
  }
  
  // 获取相册信息
  const album = db
    .select()
    .from(schema.albums)
    .where(eq(schema.albums.id, Number(id)))
    .get()
  
  if (!album) {
    throw createError({
      statusCode: 404,
      message: '相册不存在',
    })
  }
  
  // 获取相册内所有照片数量
  const photos = db
    .select({ id: schema.photos.id })
    .from(schema.photos)
    .where(eq(schema.photos.albumId, Number(id)))
    .all()
  
  const now = new Date().toISOString()
  
  // 软删除相册内的所有照片（标记 deletedAt）
  if (photos.length > 0) {
    db.update(schema.photos)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(schema.photos.albumId, Number(id)))
      .run()
  }
  
  // 删除相册记录
  db.delete(schema.albums)
    .where(eq(schema.albums.id, Number(id)))
    .run()
  
  // 记录操作日志
  logOperation(user.id, 'delete_album', 'album', Number(id), {
    albumName: album.name,
    photoCount: photos.length,
    softDeletePhotos: true,
  })
  
  return { ok: true, message: `相册已删除，${photos.length} 张照片已标记为删除` }
})
