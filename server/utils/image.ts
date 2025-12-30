import sharp from 'sharp'
import exifr from 'exifr'
import { join } from 'node:path'
import { statSync, renameSync, unlinkSync } from 'node:fs'
import { originalsDir, thumbsDir } from './paths'

// 缩略图配置
const THUMB_WIDTH = 512
const THUMB_QUALITY = 80

// 原图优化配置
const ORIGINAL_MAX_WIDTH = 4096      // 最大宽度 4K
const ORIGINAL_MAX_HEIGHT = 4096     // 最大高度 4K
const ORIGINAL_JPEG_QUALITY = 85     // JPEG 质量 85%（视觉上几乎无损）
const ORIGINAL_MAX_SIZE_MB = 1       // 超过 1MB 才压缩

/**
 * 优化原图
 * - 仅对超过阈值的图片进行处理
 * - 限制最大尺寸 4096x4096
 * - JPEG 质量 85%
 * - 保留 EXIF 信息
 * - 自动矫正方向
 * 
 * @returns 是否进行了压缩，以及新的文件大小
 */
export async function optimizeOriginal(
  storedFilename: string,
  originalSize: number
): Promise<{ optimized: boolean; newSize?: number; savedBytes?: number }> {
  // 仅对超过阈值的图片进行压缩
  if (originalSize < ORIGINAL_MAX_SIZE_MB * 1024 * 1024) {
    return { optimized: false }
  }

  const originalPath = join(originalsDir, storedFilename)

  try {
    // 读取图片元信息
    const image = sharp(originalPath)
    const metadata = await image.metadata()
    
    // 如果不是 JPEG/PNG/WebP，跳过优化
    if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) {
      return { optimized: false }
    }

    // 判断是否需要调整尺寸
    const needResize = (metadata.width && metadata.width > ORIGINAL_MAX_WIDTH) ||
                       (metadata.height && metadata.height > ORIGINAL_MAX_HEIGHT)

    // 创建处理管道
    let pipeline = sharp(originalPath)
      .rotate() // 根据 EXIF 自动矫正方向
      .withMetadata() // 保留 EXIF 信息（除了方向，因为已经矫正）

    // 需要时调整尺寸
    if (needResize) {
      pipeline = pipeline.resize({
        width: ORIGINAL_MAX_WIDTH,
        height: ORIGINAL_MAX_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true,
      })
    }

    // 根据格式输出（统一转为 JPEG 以获得更好的压缩率）
    pipeline = pipeline.jpeg({ quality: ORIGINAL_JPEG_QUALITY })

    // 写入临时文件再替换
    const tempPath = originalPath + '.optimized'
    await pipeline.toFile(tempPath)

    // 获取新文件大小
    const newStats = statSync(tempPath)

    // 只有压缩后更小才替换
    if (newStats.size < originalSize) {
      unlinkSync(originalPath)
      renameSync(tempPath, originalPath)
      
      const savedBytes = originalSize - newStats.size
      console.log(`[图片优化] ${storedFilename}: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(newStats.size / 1024 / 1024).toFixed(2)}MB (节省 ${(savedBytes / 1024 / 1024).toFixed(2)}MB)`)
      
      return { optimized: true, newSize: newStats.size, savedBytes }
    } else {
      // 压缩后反而更大，删除临时文件
      unlinkSync(tempPath)
      return { optimized: false }
    }
  } catch (error) {
    console.error(`[图片优化] 处理失败 ${storedFilename}:`, error)
    return { optimized: false }
  }
}

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
