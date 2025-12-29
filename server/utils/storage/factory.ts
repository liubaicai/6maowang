/**
 * Storage Provider Factory
 * 根据配置创建相应的存储提供商实例
 */

import type { IStorageProvider, StorageConfig } from './types'
import { StandardS3Provider } from './standard-s3-provider'
import { AliyunOSSProvider } from './aliyun-oss-provider'

/**
 * 创建存储提供商实例
 */
export function createStorageProvider(config: StorageConfig): IStorageProvider {
  switch (config.provider) {
    case 'aliyun-oss':
      return new AliyunOSSProvider(config)
    case 'standard-s3':
    default:
      return new StandardS3Provider(config)
  }
}
