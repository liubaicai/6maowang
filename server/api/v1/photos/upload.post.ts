/**
 * 上传照片接口
 * POST /api/v1/photos/upload
 * 
 * 请求头:
 * - Authorization: Bearer <token>
 * - Content-Type: multipart/form-data
 * 
 * 表单字段:
 * - albumId: 相册 ID（必填）
 * - photos: 照片文件（支持多个）
 */
import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { validateImageFile } from '../../../utils/validators'
import { generateThumbnail, getImageMetadata, parseExif } from '../../../utils/image'
import { originalsDir } from '../../../utils/paths'
import { logOperation } from '../../../utils/operation-log'
import { uploadPhotoToS3 } from '../../../utils/s3'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'
import formidable from 'formidable'
import { successResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    
    const config = useRuntimeConfig()
    const maxFileSize = (config.maxFileSize || 30) * 1024 * 1024
    
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
      return errorResponse('albumId 必填', 2001)
    }
    
    // 验证相册是否存在
    const album = db
      .select()
      .from(schema.albums)
      .where(eq(schema.albums.id, Number(albumId)))
      .get()
    
    if (!album) {
      return errorResponse('相册不存在', 2002)
    }
    
    const uploadedFiles = files.photos || []
    const now = new Date().toISOString()
    const inserted: any[] = []
    const failed: any[] = []
    
    for (const file of uploadedFiles) {
      try {
        const originalFilename = file.originalFilename || 'unknown.jpg'
        const mimeType = file.mimetype || 'image/jpeg'
        
        // 验证文件类型
        const validation = validateImageFile(originalFilename, mimeType)
        if (!validation.valid) {
          failed.push({ filename: originalFilename, error: validation.error })
          continue
        }
        
        const storedFilename = file.newFilename || ''
        
        // 生成缩略图
        const thumbnailFilename = `thumb_${storedFilename}`
        await generateThumbnail(storedFilename, thumbnailFilename)
        
        // 获取图片元数据
        const metadata = await getImageMetadata(storedFilename)
        
        // 解析 EXIF
        const exifData = await parseExif(storedFilename)
        
        // 插入数据库
        const result = db.insert(schema.photos).values({
          albumId: Number(albumId),
          originalFilename,
          storedFilename,
          thumbnailFilename,
          mimeType,
          width: metadata?.width || null,
          height: metadata?.height || null,
          exifJson: exifData ? JSON.stringify(exifData) : null,
          shotAt: exifData?.dateTimeOriginal 
            ? new Date(exifData.dateTimeOriginal).toISOString() 
            : null,
          createdBy: user.id,
          createdAt: now,
          updatedAt: now,
        }).run()
        
        const photoId = result.lastInsertRowid
        
        // 尝试上传到 S3（异步，不阻塞主流程）
        uploadPhotoToS3(storedFilename, thumbnailFilename, mimeType)
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
          id: Number(photoId),
          originalFilename,
          storedFilename,
          thumbnailFilename,
        })
      } catch (err: any) {
        failed.push({
          filename: file.originalFilename,
          error: err.message || '上传失败',
        })
      }
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
    
    return successResponse({
      uploaded: inserted.length,
      failed: failed.length,
      photos: inserted,
      errors: failed,
    }, `成功上传 ${inserted.length} 张照片`)
  } catch (error: any) {
    if (error.statusCode === 401) {
      return errorResponse(error.message, 1004)
    }
    return errorResponse(error.message || '上传失败', 3000)
  }
})
