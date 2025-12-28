import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../utils/auth'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { originalsDir, thumbsDir } from '../../utils/paths'
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
  
  // 获取相册内所有照片
  const photos = db
    .select()
    .from(schema.photos)
    .where(eq(schema.photos.albumId, Number(id)))
    .all()
  
  // 删除照片文件
  for (const photo of photos) {
    try {
      rmSync(join(originalsDir, photo.storedFilename), { force: true })
      rmSync(join(thumbsDir, photo.thumbnailFilename), { force: true })
    } catch {
      // 忽略文件删除错误
    }
  }
  
  // 删除相册（照片会级联删除）
  db.delete(schema.albums)
    .where(eq(schema.albums.id, Number(id)))
    .run()
  
  // 记录操作日志
  logOperation(user.id, 'delete_album', 'album', Number(id), {
    albumName: album.name,
    photoCount: photos.length,
  })
  
  return { ok: true }
})
