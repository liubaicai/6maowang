import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import sharp from 'sharp'
import * as schema from '../server/database/schema'
import { eq } from 'drizzle-orm'

// 数据库路径
const dbPath = join(process.cwd(), 'data', 'app.sqlite')
const originalsDir = join(process.cwd(), 'data', 'uploads', 'originals')

// 创建数据库连接
const sqlite = new Database(dbPath)
const db = drizzle(sqlite, { schema })

interface VerificationResult {
  total: number
  checked: number
  updated: number
  notFound: number
  errors: number
  details: {
    photoId: number
    filename: string
    status: 'updated' | 'match' | 'not_found' | 'error'
    oldDimensions?: { width: number | null; height: number | null }
    newDimensions?: { width: number; height: number }
    errorMessage?: string
  }[]
}

/**
 * 获取图片实际尺寸
 */
async function getActualImageDimensions(
  filename: string
): Promise<{ width: number; height: number } | null> {
  const imagePath = join(originalsDir, filename)

  if (!existsSync(imagePath)) {
    return null
  }

  try {
    const metadata = await sharp(imagePath).metadata()
    if (metadata.width && metadata.height) {
      return {
        width: metadata.width,
        height: metadata.height,
      }
    }
    return null
  } catch (error) {
    console.error(`读取图片失败 ${filename}:`, error)
    return null
  }
}

/**
 * 验证并更新图片尺寸
 */
async function verifyAndUpdateImageDimensions(): Promise<VerificationResult> {
  console.log('开始校验图片尺寸...\n')

  const result: VerificationResult = {
    total: 0,
    checked: 0,
    updated: 0,
    notFound: 0,
    errors: 0,
    details: [],
  }

  // 查询所有未删除的照片
  const photos = await db
    .select()
    .from(schema.photos)
    .all()

  result.total = photos.length
  console.log(`📊 找到 ${result.total} 张照片需要校验\n`)

  for (const photo of photos) {
    result.checked++

    console.log(
      `[${result.checked}/${result.total}] 正在检查: ${photo.storedFilename}`
    )

    // 获取实际尺寸
    const actualDimensions = await getActualImageDimensions(
      photo.storedFilename
    )

    if (!actualDimensions) {
      // 文件不存在
      console.log(`  ⚠️  文件不存在: ${photo.storedFilename}`)
      result.notFound++
      result.details.push({
        photoId: photo.id,
        filename: photo.storedFilename,
        status: 'not_found',
        oldDimensions: { width: photo.width, height: photo.height },
      })
      continue
    }

    // 比较尺寸
    const widthMatches = photo.width === actualDimensions.width
    const heightMatches = photo.height === actualDimensions.height

    if (widthMatches && heightMatches) {
      // 尺寸匹配，无需更新
      console.log(
        `  ✓ 尺寸正确: ${actualDimensions.width}x${actualDimensions.height}`
      )
      result.details.push({
        photoId: photo.id,
        filename: photo.storedFilename,
        status: 'match',
        oldDimensions: { width: photo.width, height: photo.height },
        newDimensions: actualDimensions,
      })
    } else {
      // 尺寸不匹配，需要更新
      console.log(
        `  🔄 更新尺寸: ${photo.width || '?'}x${photo.height || '?'} → ${actualDimensions.width}x${actualDimensions.height}`
      )

      try {
        await db
          .update(schema.photos)
          .set({
            width: actualDimensions.width,
            height: actualDimensions.height,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(schema.photos.id, photo.id))

        result.updated++
        result.details.push({
          photoId: photo.id,
          filename: photo.storedFilename,
          status: 'updated',
          oldDimensions: { width: photo.width, height: photo.height },
          newDimensions: actualDimensions,
        })
      } catch (error) {
        console.log(
          `  ❌ 更新失败: ${error instanceof Error ? error.message : '未知错误'}`
        )
        result.errors++
        result.details.push({
          photoId: photo.id,
          filename: photo.storedFilename,
          status: 'error',
          oldDimensions: { width: photo.width, height: photo.height },
          errorMessage: error instanceof Error ? error.message : '未知错误',
        })
      }
    }
  }

  return result
}

/**
 * 打印汇总报告
 */
function printSummary(result: VerificationResult) {
  console.log('\n' + '='.repeat(60))
  console.log('📊 校验汇总报告')
  console.log('='.repeat(60))
  console.log(`总计照片数:     ${result.total}`)
  console.log(`已检查数:       ${result.checked}`)
  console.log(`尺寸匹配:       ${result.checked - result.updated - result.notFound - result.errors}`)
  console.log(`已更新数:       ${result.updated} ${result.updated > 0 ? '✓' : ''}`)
  console.log(`文件不存在:     ${result.notFound} ${result.notFound > 0 ? '⚠️' : ''}`)
  console.log(`更新失败:       ${result.errors} ${result.errors > 0 ? '❌' : ''}`)
  console.log('='.repeat(60))

  // 打印需要更新的照片详情
  if (result.updated > 0) {
    console.log('\n更新的照片:')
    const updated = result.details.filter((d) => d.status === 'updated')
    updated.forEach((detail) => {
      console.log(
        `  [ID:${detail.photoId}] ${detail.filename}: ${detail.oldDimensions?.width || '?'}x${detail.oldDimensions?.height || '?'} → ${detail.newDimensions?.width}x${detail.newDimensions?.height}`
      )
    })
  }

  // 打印文件不存在的照片
  if (result.notFound > 0) {
    console.log('\n文件不存在的照片:')
    const notFound = result.details.filter((d) => d.status === 'not_found')
    notFound.forEach((detail) => {
      console.log(`  [ID:${detail.photoId}] ${detail.filename}`)
    })
  }

  // 打印错误的照片
  if (result.errors > 0) {
    console.log('\n更新失败的照片:')
    const errors = result.details.filter((d) => d.status === 'error')
    errors.forEach((detail) => {
      console.log(
        `  [ID:${detail.photoId}] ${detail.filename}: ${detail.errorMessage}`
      )
    })
  }
}

// 主函数
async function main() {
  try {
    const result = await verifyAndUpdateImageDimensions()
    printSummary(result)

    // 关闭数据库连接
    sqlite.close()

    // 根据结果设置退出码
    if (result.errors > 0) {
      process.exit(1)
    } else {
      process.exit(0)
    }
  } catch (error) {
    console.error('执行失败:', error)
    sqlite.close()
    process.exit(1)
  }
}

main()
