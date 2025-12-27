/**
 * 获取照片详情接口
 * GET /api/v1/photos/:id
 * 
 * 公开接口，无需认证
 */
import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { formatExifSummary } from '../../../utils/image'
import { successResponse, errorResponse } from '../../../utils/api-response'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    
    if (!id) {
      return errorResponse('照片 ID 不能为空', 3001)
    }
    
    const photo = db
      .select()
      .from(schema.photos)
      .where(eq(schema.photos.id, Number(id)))
      .get()
    
    if (!photo) {
      return errorResponse('照片不存在', 3002)
    }
    
    // 显示名称
    const displayName = photo.originalFilename.replace(/\.[^.]+$/, '')
    
    // 解析 EXIF
    let exifSummary = ''
    let exifData = null
    try {
      exifData = photo.exifJson ? JSON.parse(photo.exifJson) : null
      if (exifData) {
        exifSummary = formatExifSummary({
          make: exifData.make || exifData.Make,
          model: exifData.model || exifData.Model,
          focalLength: exifData.focalLength || exifData.FocalLength,
          fNumber: exifData.fNumber || exifData.FNumber,
          exposureTime: exifData.exposureTime || exifData.ExposureTime,
          iso: exifData.iso || exifData.ISO,
        })
      }
    } catch {
      // 忽略解析错误
    }
    
    return successResponse({
      ...photo,
      displayName,
      exifSummary,
      exifData,
    }, '获取成功')
  } catch (error: any) {
    return errorResponse(error.message || '获取失败', 3000)
  }
})
