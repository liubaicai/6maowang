/**
 * 数据库迁移脚本 v1.3.0
 * 
 * 迁移内容：
 * - 压缩现有超过 4MB 的原图
 * - 保留 EXIF 信息
 * - 限制最大尺寸 4096x4096
 * - JPEG 质量 85%（视觉上几乎无损）
 * 
 * 运行方式：npx tsx scripts/migrate-v1.3.0.ts
 */

import Database from 'better-sqlite3'
import sharp from 'sharp'
import { join } from 'node:path'
import { existsSync, statSync, renameSync, unlinkSync } from 'node:fs'

const dbPath = join(process.cwd(), 'data', 'app.sqlite')
const originalsDir = join(process.cwd(), 'data', 'uploads', 'originals')
const thumbsDir = join(process.cwd(), 'data', 'uploads', 'thumbs')

// 优化配置
const ORIGINAL_MAX_WIDTH = 4096
const ORIGINAL_MAX_HEIGHT = 4096
const ORIGINAL_JPEG_QUALITY = 85
const ORIGINAL_MAX_SIZE_MB = 1
const THUMB_WIDTH = 512
const THUMB_QUALITY = 80

const sqlite = new Database(dbPath)

console.log('=== 图片优化迁移 v1.3.0 ===\n')
console.log(`配置: 超过 ${ORIGINAL_MAX_SIZE_MB}MB 的图片将被压缩`)
console.log(`最大尺寸: ${ORIGINAL_MAX_WIDTH}x${ORIGINAL_MAX_HEIGHT}`)
console.log(`JPEG 质量: ${ORIGINAL_JPEG_QUALITY}%\n`)

interface Photo {
  id: number
  storedFilename: string
  thumbnailFilename: string
}

// 优化单张图片
async function optimizePhoto(photo: Photo): Promise<{ optimized: boolean; savedBytes: number }> {
  const originalPath = join(originalsDir, photo.storedFilename)
  
  if (!existsSync(originalPath)) {
    console.log(`  ⚠ 文件不存在: ${photo.storedFilename}`)
    return { optimized: false, savedBytes: 0 }
  }
  
  const originalSize = statSync(originalPath).size
  
  // 只处理超过阈值的图片
  if (originalSize < ORIGINAL_MAX_SIZE_MB * 1024 * 1024) {
    return { optimized: false, savedBytes: 0 }
  }
  
  try {
    const image = sharp(originalPath)
    const metadata = await image.metadata()
    
    // 如果不是 JPEG/PNG/WebP，跳过
    if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) {
      console.log(`  ⚠ 不支持的格式: ${metadata.format}`)
      return { optimized: false, savedBytes: 0 }
    }
    
    // 判断是否需要调整尺寸
    const needResize = (metadata.width && metadata.width > ORIGINAL_MAX_WIDTH) ||
                       (metadata.height && metadata.height > ORIGINAL_MAX_HEIGHT)
    
    // 创建处理管道
    let pipeline = sharp(originalPath)
      .rotate() // 根据 EXIF 自动矫正方向
      .withMetadata() // 保留 EXIF 信息
    
    if (needResize) {
      pipeline = pipeline.resize({
        width: ORIGINAL_MAX_WIDTH,
        height: ORIGINAL_MAX_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true,
      })
    }
    
    // 输出 JPEG
    pipeline = pipeline.jpeg({ quality: ORIGINAL_JPEG_QUALITY })
    
    // 写入临时文件
    const tempPath = originalPath + '.optimized'
    await pipeline.toFile(tempPath)
    
    const newSize = statSync(tempPath).size
    
    // 只有压缩后更小才替换
    if (newSize < originalSize) {
      unlinkSync(originalPath)
      renameSync(tempPath, originalPath)
      
      // 重新生成缩略图
      const thumbPath = join(thumbsDir, photo.thumbnailFilename)
      await sharp(originalPath)
        .rotate()
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .jpeg({ quality: THUMB_QUALITY })
        .toFile(thumbPath + '.new')
      
      if (existsSync(thumbPath)) {
        unlinkSync(thumbPath)
      }
      renameSync(thumbPath + '.new', thumbPath)
      
      const savedBytes = originalSize - newSize
      console.log(`  ✓ ${photo.storedFilename}: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(newSize / 1024 / 1024).toFixed(2)}MB (节省 ${(savedBytes / 1024 / 1024).toFixed(2)}MB)`)
      
      return { optimized: true, savedBytes }
    } else {
      // 压缩后反而更大，删除临时文件
      unlinkSync(tempPath)
      console.log(`  - ${photo.storedFilename}: 压缩后无收益，跳过`)
      return { optimized: false, savedBytes: 0 }
    }
  } catch (error) {
    console.error(`  ✗ 处理失败 ${photo.storedFilename}:`, error)
    return { optimized: false, savedBytes: 0 }
  }
}

async function main() {
  // 获取所有照片
  const photos = sqlite.prepare(`
    SELECT id, stored_filename as storedFilename, thumbnail_filename as thumbnailFilename
    FROM photos 
    WHERE deleted_at IS NULL
  `).all() as Photo[]
  
  console.log(`共有 ${photos.length} 张照片需要检查\n`)
  
  let optimizedCount = 0
  let totalSavedBytes = 0
  let processedCount = 0
  
  for (const photo of photos) {
    processedCount++
    process.stdout.write(`\r处理中: ${processedCount}/${photos.length}`)
    
    const result = await optimizePhoto(photo)
    
    if (result.optimized) {
      optimizedCount++
      totalSavedBytes += result.savedBytes
    }
  }
  
  console.log(`\n\n=== 迁移完成 ===`)
  console.log(`检查照片: ${photos.length} 张`)
  console.log(`优化照片: ${optimizedCount} 张`)
  console.log(`节省空间: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB`)
  
  sqlite.close()
}

main().catch(console.error)
