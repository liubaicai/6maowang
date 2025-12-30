/**
 * Storage Provider Factory
 * 根据配置创建相应的存储提供商实例
 * 使用缓存避免重复创建客户端导致文件描述符耗尽
 */

import type { IStorageProvider, StorageConfig } from './types'
import { StandardS3Provider } from './standard-s3-provider'
import { AliyunOSSProvider } from './aliyun-oss-provider'
import { TencentCOSProvider } from './tencent-cos-provider'

// 缓存 Provider 实例和配置的哈希
let cachedProvider: IStorageProvider | null = null
let cachedConfigHash: string | null = null

/**
 * 根据配置生成哈希用于比较配置是否变化
 */
function getConfigHash(config: StorageConfig): string {
  return JSON.stringify({
    provider: config.provider,
    endpoint: config.endpoint,
    region: config.region,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    publicUrl: config.publicUrl,
    useSignedUrl: config.useSignedUrl,
    urlExpirationSeconds: config.urlExpirationSeconds,
  })
}

/**
 * 创建存储提供商实例（带缓存）
 * 只有当配置变化时才会创建新实例
 */
export function createStorageProvider(config: StorageConfig): IStorageProvider {
  const configHash = getConfigHash(config)
  
  // 如果配置相同，返回缓存的 Provider
  if (cachedProvider && cachedConfigHash === configHash) {
    return cachedProvider
  }
  
  // 配置变化或首次创建，生成新的 Provider
  switch (config.provider) {
    case 'aliyun-oss':
      cachedProvider = new AliyunOSSProvider(config)
      break
    case 'tencent-cos':
      cachedProvider = new TencentCOSProvider(config)
      break
    case 'standard-s3':
    default:
      cachedProvider = new StandardS3Provider(config)
      break
  }
  
  cachedConfigHash = configHash
  return cachedProvider
}

/**
 * 清除缓存的 Provider（用于配置更新后强制刷新）
 */
export function clearStorageProviderCache(): void {
  cachedProvider = null
  cachedConfigHash = null
}
