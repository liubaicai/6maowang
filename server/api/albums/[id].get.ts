import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '相册 ID 不能为空',
    })
  }
  
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
  
  // 获取照片数量
  const photos = db
    .select({ id: schema.photos.id })
    .from(schema.photos)
    .where(eq(schema.photos.albumId, Number(id)))
    .all()
  
  // 获取封面信息
  let coverThumb: string | null = null
  if (album.coverPhotoId) {
    const photo = db
      .select({ thumbnailFilename: schema.photos.thumbnailFilename })
      .from(schema.photos)
      .where(eq(schema.photos.id, album.coverPhotoId))
      .get()
    coverThumb = photo?.thumbnailFilename || null
  }
  
  return {
    ...album,
    coverThumb,
    photoCount: photos.length,
  }
})
