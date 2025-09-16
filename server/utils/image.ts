import sharp from 'sharp'
import exifr from 'exifr'
import { join } from 'node:path'
import { originalsDir, thumbsDir } from './paths'

// 缩略图配置
const THUMB_WIDTH = 512
const THUMB_QUALITY = 80

/**
 * 生成缩略图
 * - 自动矫正 EXIF 方向
 * - 输出 JPEG 格式
 * - 宽度 512px
 */
export async function generateThumbnail(
  storedFilename: string,
  thumbFilename: string
): Promise<void> {
  const originalPath = join(originalsDir, storedFilename)
  const thumbPath = join(thumbsDir, thumbFilename)

  await sharp(originalPath)
    .rotate() // 根据 EXIF Orientation 纠正方向
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: THUMB_QUALITY })
    .toFile(thumbPath)
}

/**
 * 获取图片元数据
 */
export async function getImageMetadata(
  storedFilename: string
): Promise<{ width?: number; height?: number }> {
  const originalPath = join(originalsDir, storedFilename)
  
  try {
    const meta = await sharp(originalPath).metadata()
    return {
      width: meta.width,
      height: meta.height,
    }
  } catch {
    return {}
  }
}

/**
 * EXIF 数据接口
 */
export interface ExifData {
  make?: string
  model?: string
  focalLength?: number
  fNumber?: number
  exposureTime?: number
  iso?: number
  dateTimeOriginal?: Date
}

/**
 * 解析 EXIF 信息
 */
export async function parseExif(storedFilename: string): Promise<ExifData | null> {
  const originalPath = join(originalsDir, storedFilename)
  
  try {
    const exif = await exifr.parse(originalPath, {
      tiff: true,
      exif: true,
      gps: true,
    })
    
    if (!exif) return null
    
    return {
      make: exif.Make,
      model: exif.Model,
      focalLength: exif.FocalLength,
      fNumber: exif.FNumber,
      exposureTime: exif.ExposureTime,
      iso: exif.ISO || exif.ISOSpeedRatings,
      dateTimeOriginal: exif.DateTimeOriginal,
    }
  } catch {
    return null
  }
}

/**
 * 格式化 EXIF 摘要
 * 输出格式：Canon EOS R5 · 35mm f/2.8 1/250 ISO400
 */
export function formatExifSummary(exif: ExifData | null): string {
  if (!exif) return ''
  
  const parts: string[] = []
  
  // 相机品牌型号
  const brandModel = [exif.make, exif.model].filter(Boolean).join(' ')
  if (brandModel) {
    parts.push(brandModel)
  }
  
  // 拍摄参数
  const params: string[] = []
  
  // 焦距
  if (exif.focalLength) {
    params.push(`${Math.round(exif.focalLength)}mm`)
  }
  
  // 光圈
  if (exif.fNumber) {
    params.push(`f/${exif.fNumber.toFixed(1)}`)
  }
  
  // 快门速度
  if (exif.exposureTime) {
    if (exif.exposureTime >= 1) {
      params.push(`${Math.round(exif.exposureTime)}s`)
    } else {
      params.push(`1/${Math.round(1 / exif.exposureTime)}`)
    }
  }
  
  // ISO
  if (exif.iso) {
    params.push(`ISO${exif.iso}`)
  }
  
  if (params.length > 0) {
    parts.push(params.join(' '))
  }
  
  return parts.join(' · ')
}
