import { db, schema } from '../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { validateImageFile } from '../../utils/validators'
import { generateThumbnail, getImageMetadata, parseExif, optimizeOriginal } from '../../utils/image'
import { originalsDir } from '../../utils/paths'
import { logOperation } from '../../utils/operation-log'
import { uploadPhotoToS3 } from '../../utils/s3'
import { randomUUID } from 'node:crypto'
import { extname, join } from 'node:path'
import { writeFileSync, statSync } from 'node:fs'
import formidable from 'formidable'

export default defineEventHandler(async (event) => {
  // 验证登录
  const user = await requireAuth(event)
  
  const config = useRuntimeConfig()
  const maxFileSize = (config.maxFileSize || 30) * 1024 * 1024 // MB to bytes
  
  // 解析表单数据
  const form = formidable({
    maxFileSize,
    maxFiles: 50,
    uploadDir: originalsDir,
    keepExtensions: true,
    filename: (_name, ext, _part, _form) => {
      return randomUUID().replace(/-/g, '') + ext
    },
  })
  
  const [fields, files] = await form.parse(event.node.req)
  
  const albumId = fields.albumId?.[0]
  if (!albumId) {
    throw createError({
      statusCode: 400,
      message: 'albumId 必填',
    })
  }
  
  // 验证相册是否存在
  const album = db
    .select()
    .from(schema.albums)
    .where(eq(schema.albums.id, Number(albumId)))
    .get()
  
  if (!album) {
    throw createError({
      statusCode: 404,
      message: '相册不存在',
    })
  }
  
  const uploadedFiles = files.photos || []
  const now = new Date().toISOString()
  const inserted: any[] = []
  
  for (const file of uploadedFiles) {
    const originalFilename = file.originalFilename || 'unknown.jpg'
    const mimeType = file.mimetype || 'image/jpeg'
    
    // 验证文件类型
    const validation = validateImageFile(originalFilename, mimeType)
    if (!validation.valid) {
      console.warn(`跳过无效文件: ${originalFilename} - ${validation.error}`)
      continue
    }
    
    // 获取存储的文件名
    const storedFilename = file.newFilename
    const thumbFilename = storedFilename.replace(/\.[^.]+$/, '') + '_thumb.jpg'
    
    // 优化原图（如果超过 4MB）
    const originalPath = join(originalsDir, storedFilename)
    const originalSize = statSync(originalPath).size
    await optimizeOriginal(storedFilename, originalSize)
    
    // 生成缩略图（在原图优化之后）
    try {
      await generateThumbnail(storedFilename, thumbFilename)
    } catch (err) {
      console.error(`生成缩略图失败: ${storedFilename}`, err)
      continue
    }
    
    // 获取图片元数据
    const { width, height } = await getImageMetadata(storedFilename)
    
    // 解析 EXIF
    const exif = await parseExif(storedFilename)
    const exifJson = exif ? JSON.stringify(exif) : null
    const shotAt = exif?.dateTimeOriginal 
      ? new Date(exif.dateTimeOriginal).toISOString() 
      : null
    
    // 插入数据库
    const result = db.insert(schema.photos).values({
      albumId: Number(albumId),
      originalFilename,
      storedFilename,
      thumbnailFilename: thumbFilename,
      mimeType,
      width: width || null,
      height: height || null,
      exifJson,
      shotAt,
      createdBy: user.id,
      createdAt: now,
      updatedAt: now,
    }).run()
    
    const photoId = result.lastInsertRowid
    
    // 尝试上传到 S3（异步，不阻塞主流程）
    uploadPhotoToS3(storedFilename, thumbFilename, mimeType)
      .then(s3Result => {
        if (s3Result.originalUrl) {
          const uploadedAt = new Date().toISOString()
          db.update(schema.photos)
            .set({
              s3OriginalUrl: s3Result.originalUrl,
              s3ThumbnailUrl: s3Result.thumbnailUrl,
              s3UploadedAt: uploadedAt,
              updatedAt: uploadedAt,
            })
            .where(eq(schema.photos.id, Number(photoId)))
            .run()
        }
      })
      .catch(err => {
        console.error(`S3 上传失败 (${storedFilename}):`, err)
      })
    
    inserted.push({
      id: photoId,
      storedFilename,
      thumbFilename,
    })
  }
  
  // 更新相册时间
  db.update(schema.albums)
    .set({ updatedAt: now })
    .where(eq(schema.albums.id, Number(albumId)))
    .run()
  
  // 记录操作日志
  if (inserted.length > 0) {
    logOperation(user.id, 'upload_photos', 'photo', Number(albumId), {
      albumName: album.name,
      photoCount: inserted.length,
    })
  }
  
  return {
    ok: true,
    inserted,
    count: inserted.length,
  }
})
