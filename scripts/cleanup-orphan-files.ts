/**
 * 孤立文件清理脚本
 * 
 * 功能：
 * - 扫描 data/uploads/originals 和 data/uploads/thumbs 目录
 * - 检查文件是否在数据库中存在记录
 * - 删除数据库中不存在的孤立文件
 * - 如果配置了 S3 且文件存在于 S3，也一并删除
 * 
 * 运行方式：npx tsx scripts/cleanup-orphan-files.ts
 * 干运行模式：npx tsx scripts/cleanup-orphan-files.ts --dry-run
 */

import Database from 'better-sqlite3'
import { join, basename } from 'node:path'
import { existsSync, readdirSync, unlinkSync, statSync } from 'node:fs'
import {
  S3Client,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import OSS from 'ali-oss'
import COS from 'cos-nodejs-sdk-v5'

// 路径配置
const dbPath = join(process.cwd(), 'data', 'app.sqlite')
const originalsDir = join(process.cwd(), 'data', 'uploads', 'originals')
const thumbsDir = join(process.cwd(), 'data', 'uploads', 'thumbs')

// 是否为干运行模式（不实际删除文件）
const isDryRun = process.argv.includes('--dry-run')

// S3 配置接口
interface S3Config {
  enabled: boolean
  provider: 'standard-s3' | 'aliyun-oss' | 'tencent-cos'
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  publicUrl?: string
  useSignedUrl: boolean
  urlExpirationSeconds: number
}

// 默认 S3 配置
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

// 获取数据库中所有照片的文件名
function getDbFilenames(sqlite: Database.Database): Set<string> {
  const filenames = new Set<string>()
  
  // 获取所有照片（包括已软删除的）
  const photos = sqlite.prepare(`
    SELECT stored_filename, thumbnail_filename FROM photos
  `).all() as { stored_filename: string; thumbnail_filename: string }[]
  
  for (const photo of photos) {
    filenames.add(photo.stored_filename)
    filenames.add(photo.thumbnail_filename)
  }
  
  return filenames
}

// 获取 S3 配置
function getS3Config(sqlite: Database.Database): S3Config {
  const setting = sqlite.prepare(`
    SELECT value FROM system_settings WHERE key = 's3_config'
  `).get() as { value: string } | undefined
  
  if (!setting?.value) {
    return defaultS3Config
  }
  
  try {
    return { ...defaultS3Config, ...JSON.parse(setting.value) }
  } catch {
    return defaultS3Config
  }
}

// 创建 S3 客户端
function createS3Client(config: S3Config): S3Client | null {
  if (!config.enabled || config.provider !== 'standard-s3') {
    return null
  }
  
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true, // 使用路径风格访问
  })
}

// 创建阿里云 OSS 客户端
function createOSSClient(config: S3Config): OSS | null {
  if (!config.enabled || config.provider !== 'aliyun-oss') {
    return null
  }
  
  return new OSS({
    endpoint: config.endpoint,
    region: config.region,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.secretAccessKey,
    bucket: config.bucket,
  })
}

// 创建腾讯云 COS 客户端
function createCOSClient(config: S3Config): COS | null {
  if (!config.enabled || config.provider !== 'tencent-cos') {
    return null
  }
  
  return new COS({
    SecretId: config.accessKeyId,
    SecretKey: config.secretAccessKey,
  })
}

// 检查 S3 对象是否存在
async function checkS3ObjectExists(
  config: S3Config,
  s3Client: S3Client | null,
  ossClient: OSS | null,
  cosClient: COS | null,
  key: string
): Promise<boolean> {
  try {
    if (config.provider === 'standard-s3' && s3Client) {
      await s3Client.send(new HeadObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }))
      return true
    } else if (config.provider === 'aliyun-oss' && ossClient) {
      await ossClient.head(key)
      return true
    } else if (config.provider === 'tencent-cos' && cosClient) {
      return new Promise((resolve) => {
        cosClient.headObject({
          Bucket: config.bucket,
          Region: config.region,
          Key: key,
        }, (err) => {
          resolve(!err)
        })
      })
    }
    return false
  } catch {
    return false
  }
}

// 删除 S3 对象
async function deleteS3Object(
  config: S3Config,
  s3Client: S3Client | null,
  ossClient: OSS | null,
  cosClient: COS | null,
  key: string
): Promise<boolean> {
  try {
    if (config.provider === 'standard-s3' && s3Client) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }))
      return true
    } else if (config.provider === 'aliyun-oss' && ossClient) {
      await ossClient.delete(key)
      return true
    } else if (config.provider === 'tencent-cos' && cosClient) {
      return new Promise((resolve) => {
        cosClient.deleteObject({
          Bucket: config.bucket,
          Region: config.region,
          Key: key,
        }, (err) => {
          resolve(!err)
        })
      })
    }
    return false
  } catch (error) {
    console.error(`  ✗ 删除 S3 对象失败 ${key}:`, error)
    return false
  }
}

// 扫描目录获取所有文件
function scanDirectory(dir: string): string[] {
  if (!existsSync(dir)) {
    return []
  }
  
  try {
    return readdirSync(dir).filter(file => {
      // 排除 .gitkeep 文件
      if (file === '.gitkeep') {
        return false
      }
      const fullPath = join(dir, file)
      return statSync(fullPath).isFile()
    })
  } catch (error) {
    console.error(`扫描目录失败 ${dir}:`, error)
    return []
  }
}

// 格式化字节大小
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

async function main() {
  console.log('=== 孤立文件清理脚本 ===\n')
  
  if (isDryRun) {
    console.log('⚠ 干运行模式：不会实际删除任何文件\n')
  }
  
  // 检查数据库文件是否存在
  if (!existsSync(dbPath)) {
    console.error('✗ 数据库文件不存在:', dbPath)
    process.exit(1)
  }
  
  const sqlite = new Database(dbPath)
  
  // 获取数据库中的文件名
  console.log('正在读取数据库...')
  const dbFilenames = getDbFilenames(sqlite)
  console.log(`数据库中共有 ${dbFilenames.size} 个文件记录\n`)
  
  // 获取 S3 配置
  const s3Config = getS3Config(sqlite)
  const s3Enabled = s3Config.enabled
  
  // 创建 S3 客户端
  let s3Client: S3Client | null = null
  let ossClient: OSS | null = null
  let cosClient: COS | null = null
  
  if (s3Enabled) {
    console.log(`S3 存储已启用 (${s3Config.provider})`)
    s3Client = createS3Client(s3Config)
    ossClient = createOSSClient(s3Config)
    cosClient = createCOSClient(s3Config)
  } else {
    console.log('S3 存储未启用')
  }
  console.log('')
  
  // 统计信息
  let orphanOriginals = 0
  let orphanThumbs = 0
  let deletedOriginals = 0
  let deletedThumbs = 0
  let deletedS3Originals = 0
  let deletedS3Thumbs = 0
  let freedBytes = 0
  
  // 扫描原图目录
  console.log('扫描原图目录...')
  const originalFiles = scanDirectory(originalsDir)
  console.log(`发现 ${originalFiles.length} 个原图文件`)
  
  for (const filename of originalFiles) {
    if (!dbFilenames.has(filename)) {
      orphanOriginals++
      const filePath = join(originalsDir, filename)
      const fileSize = statSync(filePath).size
      
      console.log(`  孤立原图: ${filename} (${formatBytes(fileSize)})`)
      
      if (!isDryRun) {
        // 删除本地文件
        try {
          unlinkSync(filePath)
          deletedOriginals++
          freedBytes += fileSize
          console.log(`    ✓ 已删除本地文件`)
        } catch (error) {
          console.error(`    ✗ 删除失败:`, error)
        }
        
        // 检查并删除 S3 文件
        if (s3Enabled) {
          const s3Key = `originals/${filename}`
          const exists = await checkS3ObjectExists(s3Config, s3Client, ossClient, cosClient, s3Key)
          if (exists) {
            const deleted = await deleteS3Object(s3Config, s3Client, ossClient, cosClient, s3Key)
            if (deleted) {
              deletedS3Originals++
              console.log(`    ✓ 已删除 S3 文件: ${s3Key}`)
            }
          }
        }
      } else {
        freedBytes += fileSize
        
        // 干运行模式下也检查 S3
        if (s3Enabled) {
          const s3Key = `originals/${filename}`
          const exists = await checkS3ObjectExists(s3Config, s3Client, ossClient, cosClient, s3Key)
          if (exists) {
            console.log(`    → S3 中存在: ${s3Key}`)
          }
        }
      }
    }
  }
  
  console.log('')
  
  // 扫描缩略图目录
  console.log('扫描缩略图目录...')
  const thumbFiles = scanDirectory(thumbsDir)
  console.log(`发现 ${thumbFiles.length} 个缩略图文件`)
  
  for (const filename of thumbFiles) {
    if (!dbFilenames.has(filename)) {
      orphanThumbs++
      const filePath = join(thumbsDir, filename)
      const fileSize = statSync(filePath).size
      
      console.log(`  孤立缩略图: ${filename} (${formatBytes(fileSize)})`)
      
      if (!isDryRun) {
        // 删除本地文件
        try {
          unlinkSync(filePath)
          deletedThumbs++
          freedBytes += fileSize
          console.log(`    ✓ 已删除本地文件`)
        } catch (error) {
          console.error(`    ✗ 删除失败:`, error)
        }
        
        // 检查并删除 S3 文件
        if (s3Enabled) {
          const s3Key = `thumbs/${filename}`
          const exists = await checkS3ObjectExists(s3Config, s3Client, ossClient, cosClient, s3Key)
          if (exists) {
            const deleted = await deleteS3Object(s3Config, s3Client, ossClient, cosClient, s3Key)
            if (deleted) {
              deletedS3Thumbs++
              console.log(`    ✓ 已删除 S3 文件: ${s3Key}`)
            }
          }
        }
      } else {
        freedBytes += fileSize
        
        // 干运行模式下也检查 S3
        if (s3Enabled) {
          const s3Key = `thumbs/${filename}`
          const exists = await checkS3ObjectExists(s3Config, s3Client, ossClient, cosClient, s3Key)
          if (exists) {
            console.log(`    → S3 中存在: ${s3Key}`)
          }
        }
      }
    }
  }
  
  // 输出统计
  console.log('\n=== 清理统计 ===')
  console.log(`扫描文件: ${originalFiles.length} 原图 + ${thumbFiles.length} 缩略图`)
  console.log(`孤立文件: ${orphanOriginals} 原图 + ${orphanThumbs} 缩略图`)
  
  if (isDryRun) {
    console.log(`\n预计释放空间: ${formatBytes(freedBytes)}`)
    console.log('\n提示: 使用不带 --dry-run 参数运行以实际删除文件')
  } else {
    console.log(`\n删除本地文件: ${deletedOriginals} 原图 + ${deletedThumbs} 缩略图`)
    if (s3Enabled) {
      console.log(`删除 S3 文件: ${deletedS3Originals} 原图 + ${deletedS3Thumbs} 缩略图`)
    }
    console.log(`释放空间: ${formatBytes(freedBytes)}`)
  }
  
  sqlite.close()
  console.log('\n清理完成!')
}

main().catch(console.error)
