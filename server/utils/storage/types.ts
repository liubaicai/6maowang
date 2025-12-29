/**
 * Storage Provider Interface
 * 定义存储服务提供商的统一接口
 */

// 存储提供商类型
export type StorageProviderType = 'standard-s3' | 'aliyun-oss'

// 存储配置基础接口
export interface StorageConfig {
  enabled: boolean
  provider: StorageProviderType
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  publicUrl: string // 公开访问 URL 前缀（可选，用于公开存储桶）
  useSignedUrl: boolean // 是否使用签名 URL（私有存储桶时必须）
  urlExpirationSeconds: number // 签名 URL 过期时间（秒）
}

// 上传结果
export interface UploadResult {
  key: string // 存储的相对路径（不包含域名）
  url?: string // 完整访问 URL（可选）
}

// 存储提供商接口
export interface IStorageProvider {
  /**
   * 测试连接
   */
  testConnection(): Promise<{ success: boolean; message: string }>

  /**
   * 检查对象是否存在
   */
  checkObjectExists(key: string): Promise<boolean>

  /**
   * 上传文件
   */
  uploadFile(localPath: string, key: string, contentType: string): Promise<UploadResult>

  /**
   * 获取文件访问 URL（如果是私有存储，返回签名 URL）
   */
  getFileUrl(key: string | null, expireSeconds?: number): Promise<string | null>

  /**
   * 列出对象（用于统计）
   */
  listObjects(continuationToken?: string): Promise<{
    objects: Array<{ key: string; size: number }>
    nextToken?: string
  }>

  /**
   * 删除对象
   */
  deleteObject(key: string): Promise<void>
}
