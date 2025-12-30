import { db, schema } from '../database'
import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { originalsDir, thumbsDir } from './paths'
import { createStorageProvider, clearStorageProviderCache, type StorageConfig, type IStorageProvider } from './storage'

// S3 配置接口（扩展 StorageConfig）
export interface S3Config extends StorageConfig {
  // 保持向后兼容
}

// 默认配置
const defaultS3Config: S3Config = {
  enabled: false,
  provider: 'standard-s3',
  endpoint: '',
  region: 'us-east-1',
  bucket: '',
  accessKeyId: '',
  secretAccessKey: '',
  publicUrl: undefined,
  useSignedUrl: false,
  urlExpirationSeconds: 3600,
}

// 获取 S3 配置
export function getS3Config(): S3Config {
  const settings = db
    .select()
    .from(schema.systemSettings)
    .where(eq(schema.systemSettings.key, 's3_config'))
    .get()

  if (!settings?.value) {
    return defaultS3Config
  }

  try {
    return { ...defaultS3Config, ...JSON.parse(settings.value) }
  } catch {
    return defaultS3Config
  }
}

// 保存 S3 配置
export function saveS3Config(config: Partial<S3Config>): void {
  const now = new Date().toISOString()
  const currentConfig = getS3Config()
  const newConfig = { ...currentConfig, ...config }

  const existing = db
    .select()
    .from(schema.systemSettings)
    .where(eq(schema.systemSettings.key, 's3_config'))
    .get()

  if (existing) {
    db.update(schema.systemSettings)
      .set({ value: JSON.stringify(newConfig), updatedAt: now })
      .where(eq(schema.systemSettings.key, 's3_config'))
      .run()
  } else {
    db.insert(schema.systemSettings).values({
      key: 's3_config',
      value: JSON.stringify(newConfig),
      updatedAt: now,
    }).run()
  }
  
  // 清除缓存的存储提供商实例，使新配置生效
  clearStorageProviderCache()
}

// 创建存储提供商实例
function getStorageProvider(config: S3Config): IStorageProvider {
  return createStorageProvider(config)
}

// 检测 S3 连接
export async function testS3Connection(config: S3Config): Promise<{ success: boolean; message: string }> {
  try {
    const provider = getStorageProvider(config)
    return await provider.testConnection()
  } catch (error: any) {
    console.error('存储连接测试失败:', error)
    return { success: false, message: error.message || '连接失败' }
  }
}

// 检测 S3 文件是否存在
export async function checkS3ObjectExists(config: S3Config, s3Key: string): Promise<boolean> {
  try {
    const provider = getStorageProvider(config)
    return await provider.checkObjectExists(s3Key)
  } catch (error: any) {
    console.error('检查文件是否存在失败:', error)
    return false
  }
}

// 上传文件到 S3
export async function uploadToS3(
  config: S3Config,
  localPath: string,
  s3Key: string,
  contentType: string
): Promise<string> {
  const provider = getStorageProvider(config)
  const result = await provider.uploadFile(localPath, s3Key, contentType)
  
  // 返回相对路径（s3Key）
  return result.key
}

// 根据相对路径生成访问 URL（支持签名 URL）
export async function getS3PublicUrl(s3Key: string | null): Promise<string | null> {
  if (!s3Key) return null
  const config = getS3Config()
  if (!config.enabled) return null
  
  // 检测是否是完整 URL（旧格式数据），如果是则提取相对路径
  let key = s3Key
  if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) {
    // 尝试从完整 URL 中提取相对路径
    // URL 格式可能是: https://endpoint/bucket/originals/xxx.jpg 或 https://bucket.endpoint/originals/xxx.jpg
    try {
      const url = new URL(s3Key)
      const pathname = url.pathname
      // 移除开头的 / 和可能的 bucket 名称
      let path = pathname.startsWith('/') ? pathname.substring(1) : pathname
      // 如果路径以 bucket 名开头，移除它
      if (path.startsWith(config.bucket + '/')) {
        path = path.substring(config.bucket.length + 1)
      }
      key = path
    } catch {
      // URL 解析失败，使用原值
      console.warn('无法解析 S3 URL:', s3Key)
    }
  }
  
  try {
    const provider = getStorageProvider(config)
    return await provider.getFileUrl(key)
  } catch (error) {
    console.error('获取文件 URL 失败:', error)
    return null
  }
}

// 上传原图和缩略图到 S3（返回相对路径）
export async function uploadPhotoToS3(
  storedFilename: string,
  thumbnailFilename: string,
  mimeType: string
): Promise<{ originalUrl: string | null; thumbnailUrl: string | null }> {
  const config = getS3Config()
  
  if (!config.enabled) {
    return { originalUrl: null, thumbnailUrl: null }
  }

  const result: { originalUrl: string | null; thumbnailUrl: string | null } = {
    originalUrl: null,
    thumbnailUrl: null,
  }

  try {
    // 上传原图
    const originalPath = join(originalsDir, storedFilename)
    const originalKey = `originals/${storedFilename}`
    
    // 检查本地原图是否存在
    if (!existsSync(originalPath)) {
      console.warn(`本地原图不存在，跳过上传: ${originalPath}`)
      return result
    }
    
    result.originalUrl = await uploadToS3(config, originalPath, originalKey, mimeType)

    // 上传缩略图
    const thumbPath = join(thumbsDir, thumbnailFilename)
    const thumbKey = `thumbs/${thumbnailFilename}`
    
    // 检查本地缩略图是否存在
    if (existsSync(thumbPath)) {
      result.thumbnailUrl = await uploadToS3(config, thumbPath, thumbKey, 'image/jpeg')
    } else {
      console.warn(`本地缩略图不存在，跳过上传: ${thumbPath}`)
      // 缩略图不存在时，使用原图 URL 作为替代
      result.thumbnailUrl = result.originalUrl
    }
  } catch (error) {
    console.error('上传到 S3 失败:', error)
  }

  return result
}

// 获取 S3 存储统计
export async function getS3StorageStats(): Promise<{
  enabled: boolean
  totalSize: number
  totalSizeFormatted: string
  objectCount: number
}> {
  const config = getS3Config()
  
  if (!config.enabled) {
    return {
      enabled: false,
      totalSize: 0,
      totalSizeFormatted: '0 B',
      objectCount: 0,
    }
  }

  try {
    const provider = getStorageProvider(config)
    let totalSize = 0
    let objectCount = 0
    let continuationToken: string | undefined

    do {
      const response = await provider.listObjects(continuationToken)

      for (const obj of response.objects) {
        totalSize += obj.size || 0
        objectCount++
      }

      continuationToken = response.nextToken
    } while (continuationToken)

    return {
      enabled: true,
      totalSize,
      totalSizeFormatted: formatBytes(totalSize),
      objectCount,
    }
  } catch (error) {
    console.error('获取存储统计失败:', error)
    return {
      enabled: true,
      totalSize: 0,
      totalSizeFormatted: '0 B',
      objectCount: 0,
    }
  }
}

// 同步本地照片到 S3（带并发控制和文件存在性检测）
export async function syncPhotosToS3(
  onProgress?: (current: number, total: number, filename: string) => void
): Promise<{ synced: number; failed: number; skipped: number; errors: string[] }> {
  const config = getS3Config()
  
  if (!config.enabled) {
    return { synced: 0, failed: 0, skipped: 0, errors: ['S3 未启用'] }
  }

  // 查找所有照片（排除已删除的）
  const photos = db
    .select()
    .from(schema.photos)
    .all()
    .filter(p => !p.deletedAt)

  let synced = 0
  let failed = 0
  let skipped = 0
  const errors: string[] = []
  const total = photos.length
  
  // 批处理大小 - 减少并发以避免文件描述符耗尽
  const batchSize = 3
  
  for (let i = 0; i < photos.length; i += batchSize) {
    const batch = photos.slice(i, i + batchSize)
    
    // 串行处理每批照片，避免文件描述符耗尽
    for (let j = 0; j < batch.length; j++) {
      const photo = batch[j]
      const currentIndex = i + j
      
      if (onProgress) {
        onProgress(currentIndex + 1, total, photo.storedFilename)
      }

      try {
        // 先检查本地原图是否存在
        const localOriginalPath = join(originalsDir, photo.storedFilename)
        if (!existsSync(localOriginalPath)) {
          // 本地文件不存在，跳过
          skipped++
          continue
        }
        
        // 检测 S3 上是否已存在原图
        const originalKey = `originals/${photo.storedFilename}`
        const exists = await checkS3ObjectExists(config, originalKey)
        
        if (exists) {
          // S3 上已存在，跳过上传但确保数据库有相对路径
          if (!photo.s3OriginalUrl) {
            const now = new Date().toISOString()
            const thumbKey = `thumbs/${photo.thumbnailFilename}`
            db.update(schema.photos)
              .set({
                s3OriginalUrl: originalKey,
                s3ThumbnailUrl: thumbKey,
                s3UploadedAt: now,
                updatedAt: now,
              })
              .where(eq(schema.photos.id, photo.id))
              .run()
          }
          skipped++
          continue
        }
        
        // S3 上不存在，执行上传
        const result = await uploadPhotoToS3(
          photo.storedFilename,
          photo.thumbnailFilename,
          photo.mimeType
        )

        if (result.originalUrl) {
          const now = new Date().toISOString()
          db.update(schema.photos)
            .set({
              s3OriginalUrl: result.originalUrl,
              s3ThumbnailUrl: result.thumbnailUrl,
              s3UploadedAt: now,
              updatedAt: now,
            })
            .where(eq(schema.photos.id, photo.id))
            .run()
          
          synced++
        } else {
          failed++
          errors.push(`${photo.storedFilename}: 上传失败`)
        }
      } catch (error: any) {
        failed++
        errors.push(`${photo.storedFilename}: ${error.message}`)
        console.error(`上传到 S3 失败 (${photo.storedFilename}):`, error.message)
      }
    }
    
    // 每批处理完后等待 200ms，让系统有时间回收资源
    if (i + batchSize < photos.length) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  return { synced, failed, skipped, errors }
}

// 格式化字节大小
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
