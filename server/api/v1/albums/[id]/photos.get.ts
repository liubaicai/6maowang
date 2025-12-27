/**
 * 获取相册照片列表接口
 * GET /api/v1/albums/:id/photos
 * 
 * 查询参数:
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 20）
 * 
 * 公开接口，无需认证
 */
import { db, schema } from '../../../../database'
import { eq, desc, count } from 'drizzle-orm'
import { formatExifSummary } from '../../../../utils/image'
import { paginatedResponse, errorResponse } from '../../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    const albumId = getRouterParam(event, 'id')
    
    if (!albumId) {
      return errorResponse('相册 ID 不能为空', 2001)
    }
    
    // 验证相册存在
    const album = db
      .select()
      .from(schema.albums)
      .where(eq(schema.albums.id, Number(albumId)))
      .get()
    
    if (!album) {
      return errorResponse('相册不存在', 2002)
    }
    
    const query = getQuery(event)
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
    const offset = (page - 1) * pageSize
    
    // 获取总数
    const totalResult = db
      .select({ count: count() })
      .from(schema.photos)
      .where(eq(schema.photos.albumId, Number(albumId)))
      .get()
    const total = totalResult?.count || 0
    
    // 获取照片列表
    const photos = db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.albumId, Number(albumId)))
      .orderBy(desc(schema.photos.createdAt))
      .limit(pageSize)
      .offset(offset)
      .all()
    
    // 格式化返回数据
    const result = photos.map((photo) => {
      const displayName = photo.originalFilename.replace(/\.[^.]+$/, '')
      
      let exifSummary = ''
      try {
        const exif = photo.exifJson ? JSON.parse(photo.exifJson) : null
        if (exif) {
          exifSummary = formatExifSummary({
            make: exif.Make || exif.make,
            model: exif.Model || exif.model,
            focalLength: exif.FocalLength || exif.focalLength,
            fNumber: exif.FNumber || exif.fNumber,
            exposureTime: exif.ExposureTime || exif.exposureTime,
            iso: exif.ISO || exif.iso,
          })
        }
      } catch {
        // 忽略解析错误
      }
      
      return {
        ...photo,
        displayName,
        exifSummary,
      }
    })
    
    return paginatedResponse(result, total, page, pageSize, '获取成功')
  } catch (error: any) {
    return errorResponse(error.message || '获取失败', 3000)
  }
})
