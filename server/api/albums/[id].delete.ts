import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { originalsDir, thumbsDir } from '../../utils/paths'

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
  
  return { ok: true }
})
