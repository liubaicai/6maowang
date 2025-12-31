import { requireAdmin } from '../../../utils/auth'
import { getS3Config } from '../../../utils/s3'
import { createStorageProvider } from '../../../utils/storage'

export default defineEventHandler(async (event) => {
  // 仅管理员可访问
  await requireAdmin(event)
  
  const query = getQuery(event)
  const prefix = (query.prefix as string) || ''
  const continuationToken = query.token as string | undefined
  
  const config = getS3Config()
  
  if (!config.enabled) {
    return {
      enabled: false,
      files: [],
      folders: [],
      prefix: '',
      hasMore: false,
      nextToken: null,
    }
  }
  
  try {
    const provider = createStorageProvider(config)
    
    // 列出对象，按前缀和分隔符
    const response = await provider.listObjects(continuationToken, prefix, '/')
    
    // 处理文件夹（CommonPrefixes）
    const folders: { name: string; path: string }[] = []
    for (const folderPrefix of response.commonPrefixes || []) {
      const name = folderPrefix.replace(prefix, '').replace(/\/$/, '')
      if (name) {
        folders.push({
          name,
          path: folderPrefix,
        })
      }
    }
    
    // 处理文件
    const files: {
      name: string
      key: string
      size: number
      sizeFormatted: string
      lastModified: string
      extension?: string
    }[] = []
    
    for (const obj of response.objects) {
      const key = obj.key
      // 跳过目录占位符
      if (key.endsWith('/')) continue
      
      const name = key.split('/').pop() || key
      const extension = name.includes('.') ? name.split('.').pop()?.toLowerCase() : undefined
      
      files.push({
        name,
        key,
        size: obj.size || 0,
        sizeFormatted: formatBytes(obj.size || 0),
        lastModified: obj.lastModified?.toISOString() || '',
        extension,
      })
    }
    
    // 排序：文件夹在前，文件在后
    folders.sort((a, b) => a.name.localeCompare(b.name))
    files.sort((a, b) => a.name.localeCompare(b.name))
    
    return {
      enabled: true,
      folders,
      files,
      prefix,
      parentPrefix: prefix ? prefix.split('/').slice(0, -2).join('/') + (prefix.split('/').length > 2 ? '/' : '') : null,
      hasMore: !!response.nextToken,
      nextToken: response.nextToken || null,
    }
  } catch (error: any) {
    console.error('列出 S3 文件失败:', error)
    throw createError({
      statusCode: 500,
      message: error.message || '获取 S3 文件列表失败',
    })
  }
})

// 格式化字节大小
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}
