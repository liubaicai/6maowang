/**
 * API 请求日志中间件
 * 记录所有进入的 API 请求
 * - 开发模式：打印完整请求体和响应体
 * - 生产模式：仅打印简要日志（方法、路径、状态码、耗时）
 */

// 是否为开发模式
const isDev = process.env.NODE_ENV !== 'production'

// ANSI 颜色码
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
}

// HTTP 方法颜色
const methodColors: Record<string, string> = {
  GET: colors.green,
  POST: colors.blue,
  PUT: colors.yellow,
  PATCH: colors.yellow,
  DELETE: colors.red,
}

// 状态码颜色
function getStatusColor(status: number): string {
  if (status >= 500) return colors.red
  if (status >= 400) return colors.yellow
  if (status >= 300) return colors.cyan
  if (status >= 200) return colors.green
  return colors.gray
}

// 格式化耗时
function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

// 格式化 JSON（限制长度）
function formatJson(data: unknown, maxLength = 2000): string {
  try {
    const json = JSON.stringify(data, null, 2)
    if (json.length > maxLength) {
      return json.substring(0, maxLength) + '\n... (truncated)'
    }
    return json
  } catch {
    return String(data)
  }
}

// 分隔线
const separator = `${colors.dim}${'─'.repeat(80)}${colors.reset}`

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname
  
  // 只记录 API 请求（排除静态文件和上传文件请求）
  if (!path.startsWith('/api') || path.startsWith('/api/uploads')) {
    return
  }

  const startTime = performance.now()
  const method = event.method
  const query = url.search || ''
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const timestamp = new Date().toLocaleString('zh-CN', { 
    timeZone: 'Asia/Shanghai',
    hour12: false,
  })

  // 方法颜色
  const methodColor = methodColors[method] || colors.gray
  const methodPadded = method.padEnd(7)

  // 生产模式：仅打印简要日志
  if (!isDev) {
    console.log(
      `${colors.dim}[${timestamp}]${colors.reset} ` +
      `${methodColor}${methodPadded}${colors.reset} ` +
      `${colors.bright}${path}${colors.reset}${colors.dim}${query}${colors.reset} ` +
      `${colors.gray}${ip}${colors.reset}`
    )
    
    event.node.res.on('finish', () => {
      const duration = performance.now() - startTime
      const status = event.node.res.statusCode
      const statusColor = getStatusColor(status)
      
      console.log(
        `${colors.dim}[${timestamp}]${colors.reset} ` +
        `${methodColor}${methodPadded}${colors.reset} ` +
        `${colors.bright}${path}${colors.reset} ` +
        `${statusColor}${status}${colors.reset} ` +
        `${colors.magenta}${formatDuration(duration)}${colors.reset}`
      )
    })
    return
  }

  // 开发模式：打印完整请求体和响应体

  // 获取请求头
  const contentType = getHeader(event, 'content-type') || ''
  const authorization = getHeader(event, 'authorization') 
    ? 'Bearer ***' 
    : '-'

  // 读取请求体（仅对 POST/PUT/PATCH）
  let requestBody: unknown = null
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      // 跳过文件上传请求的 body 读取
      if (!contentType.includes('multipart/form-data')) {
        requestBody = await readBody(event)
      } else {
        requestBody = '[multipart/form-data - 文件上传]'
      }
    } catch {
      requestBody = '[无法读取请求体]'
    }
  }

  // 打印请求信息
  console.log('\n' + separator)
  console.log(
    `${colors.cyan}→ REQUEST${colors.reset} ` +
    `${colors.dim}[${timestamp}]${colors.reset} ` +
    `${colors.gray}${ip}${colors.reset}`
  )
  console.log(
    `  ${methodColor}${colors.bright}${methodPadded}${colors.reset} ` +
    `${colors.bright}${path}${colors.reset}${colors.dim}${query}${colors.reset}`
  )
  console.log(
    `  ${colors.dim}Content-Type:${colors.reset} ${contentType || '-'}`
  )
  console.log(
    `  ${colors.dim}Authorization:${colors.reset} ${authorization}`
  )
  
  if (requestBody && requestBody !== '[multipart/form-data - 文件上传]') {
    console.log(`  ${colors.dim}Body:${colors.reset}`)
    // 隐藏密码字段
    const safeBody = typeof requestBody === 'object' && requestBody !== null
      ? JSON.parse(JSON.stringify(requestBody, (key, value) => 
          key.toLowerCase().includes('password') ? '***' : value
        ))
      : requestBody
    console.log(colors.gray + formatJson(safeBody).split('\n').map(l => '    ' + l).join('\n') + colors.reset)
  } else if (requestBody) {
    console.log(`  ${colors.dim}Body:${colors.reset} ${requestBody}`)
  }

  // 拦截响应
  const originalEnd = event.node.res.end
  let responseBody: unknown = null

  event.node.res.end = function(chunk: unknown, ...args: unknown[]) {
    if (chunk) {
      try {
        const str = typeof chunk === 'string' ? chunk : chunk.toString()
        responseBody = JSON.parse(str)
      } catch {
        responseBody = typeof chunk === 'string' ? chunk : '[Binary Data]'
      }
    }
    // @ts-expect-error - 调用原始方法
    return originalEnd.call(this, chunk, ...args)
  }

  // 响应完成后记录
  event.node.res.on('finish', () => {
    const duration = performance.now() - startTime
    const status = event.node.res.statusCode
    const statusColor = getStatusColor(status)
    
    console.log(
      `${statusColor}← RESPONSE${colors.reset} ` +
      `${statusColor}${status}${colors.reset} ` +
      `${colors.magenta}${formatDuration(duration)}${colors.reset}`
    )
    
    if (responseBody) {
      console.log(`  ${colors.dim}Body:${colors.reset}`)
      console.log(colors.gray + formatJson(responseBody).split('\n').map(l => '    ' + l).join('\n') + colors.reset)
    }
    
    console.log(separator + '\n')
  })
})
