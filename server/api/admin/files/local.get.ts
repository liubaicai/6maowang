import { requireAdmin } from '../../../utils/auth'
import { join, relative, basename, extname } from 'node:path'
import { existsSync, readdirSync, statSync } from 'node:fs'

export default defineEventHandler(async (event) => {
  // 仅管理员可访问
  await requireAdmin(event)
  
  const query = getQuery(event)
  const requestPath = (query.path as string) || ''
  
  // 基础目录
  const baseDir = join(process.cwd(), 'data')
  
  // 解析请求路径
  let targetPath = join(baseDir, requestPath)
  
  // 安全检查：确保路径在 data 目录内
  const relativePath = relative(baseDir, targetPath)
  if (relativePath.startsWith('..') || relativePath.startsWith('/')) {
    throw createError({
      statusCode: 400,
      message: '非法路径',
    })
  }
  
  // 检查路径是否存在
  if (!existsSync(targetPath)) {
    throw createError({
      statusCode: 404,
      message: '路径不存在',
    })
  }
  
  // 获取目录统计
  const stat = statSync(targetPath)
  
  if (!stat.isDirectory()) {
    throw createError({
      statusCode: 400,
      message: '请求的路径不是目录',
    })
  }
  
  // 读取目录内容
  const items = readdirSync(targetPath)
  
  const files: {
    name: string
    path: string
    type: 'file' | 'directory'
    size: number
    mtime: string
    extension?: string
  }[] = []
  
  for (const item of items) {
    // 跳过隐藏文件和数据库文件
    if (item.startsWith('.') || item.endsWith('.sqlite') || item.endsWith('.sqlite-wal') || item.endsWith('.sqlite-shm')) {
      continue
    }
    
    const itemPath = join(targetPath, item)
    const itemRelativePath = join(requestPath, item)
    
    try {
      const itemStat = statSync(itemPath)
      
      files.push({
        name: item,
        path: itemRelativePath,
        type: itemStat.isDirectory() ? 'directory' : 'file',
        size: itemStat.size,
        mtime: itemStat.mtime.toISOString(),
        extension: itemStat.isFile() ? extname(item).toLowerCase() : undefined,
      })
    } catch (e) {
      // 忽略无法读取的文件
    }
  }
  
  // 排序：目录在前，文件在后
  files.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
  
  return {
    currentPath: requestPath,
    parentPath: requestPath ? requestPath.split('/').slice(0, -1).join('/') : null,
    files,
    total: files.length,
  }
})
