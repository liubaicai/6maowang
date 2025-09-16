import { db, schema } from '../../database'
import { eq, desc } from 'drizzle-orm'

export default defineEventHandler(async () => {
  // 获取相册列表，包含封面信息
  const albums = db
    .select({
      id: schema.albums.id,
      name: schema.albums.name,
      description: schema.albums.description,
      coverPhotoId: schema.albums.coverPhotoId,
      createdAt: schema.albums.createdAt,
      updatedAt: schema.albums.updatedAt,
    })
    .from(schema.albums)
    .orderBy(desc(schema.albums.updatedAt))
    .all()
  
  // 获取封面缩略图
  const result = albums.map((album) => {
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
    }
  })
  
  return result
})
