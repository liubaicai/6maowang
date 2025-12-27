/**
 * 统一的 API 响应格式
 * 为移动端 App 提供一致的响应结构
 */

export interface ApiResponse<T = any> {
  code: number        // 业务状态码：0 表示成功，其他表示错误
  message: string     // 消息描述
  data: T | null      // 响应数据
  timestamp: number   // 响应时间戳
}

/**
 * 成功响应
 */
export function successResponse<T>(data: T, message = '操作成功'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    timestamp: Date.now(),
  }
}

/**
 * 错误响应
 */
export function errorResponse(message: string, code = -1): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: Date.now(),
  }
}

/**
 * 分页数据响应
 */
export interface PaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function paginatedResponse<T>(
  list: T[],
  total: number,
  page: number,
  pageSize: number,
  message = '获取成功'
): ApiResponse<PaginatedData<T>> {
  return successResponse(
    {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    },
    message
  )
}
