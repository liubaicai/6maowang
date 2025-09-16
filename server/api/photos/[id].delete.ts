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
  
  // 删除文件
  try {
    rmSync(join(originalsDir, photo.storedFilename), { force: true })
    rmSync(join(thumbsDir, photo.thumbnailFilename), { force: true })
  } catch {
    // 忽略文件删除错误
  }
  
  // 删除数据库记录
  db.delete(schema.photos)
    .where(eq(schema.photos.id, Number(id)))
    .run()
  
  // 如果该照片是相册封面，清除封面设置
  db.update(schema.albums)
    .set({ coverPhotoId: null })
    .where(eq(schema.albums.coverPhotoId, Number(id)))
    .run()
  
  return { ok: true }
})
