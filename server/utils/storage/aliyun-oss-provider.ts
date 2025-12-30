/**
 * Aliyun OSS Provider Implementation
 * 阿里云 OSS 实现
 */

import OSS from 'ali-oss'
import { readFileSync } from 'node:fs'
import type { IStorageProvider, StorageConfig, UploadResult } from './types'

export class AliyunOSSProvider implements IStorageProvider {
  private client: OSS
  private config: StorageConfig

  constructor(config: StorageConfig) {
    this.config = config
    
    // 阿里云 OSS 配置
    // endpoint 格式: https://oss-cn-hangzhou.aliyuncs.com 或自定义域名
    this.client = new OSS({
      region: config.region, // 例如: oss-cn-hangzhou
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.secretAccessKey,
      bucket: config.bucket,
      endpoint: config.endpoint,
      secure: true, // 使用 HTTPS
    })
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // 尝试获取 bucket 信息来测试连接
      await this.client.getBucketInfo(this.config.bucket)
      return { success: true, message: '阿里云 OSS 连接成功' }
    } catch (error: any) {
      console.error('阿里云 OSS 连接测试失败:', error)
      return { success: false, message: error.message || '阿里云 OSS 连接失败' }
    }
  }

  async checkObjectExists(key: string): Promise<boolean> {
    try {
      await this.client.head(key)
      return true
    } catch (error: any) {
      // 404 表示文件不存在
      if (error.code === 'NoSuchKey' || error.status === 404) {
        return false
      }
      // 其他错误也当作不存在处理
      return false
    }
  }

  async uploadFile(localPath: string, key: string, contentType: string): Promise<UploadResult> {
    // 读取文件内容
    const fileBuffer = readFileSync(localPath)
    
    // 上传到 OSS
    const result = await this.client.put(key, fileBuffer, {
      mime: contentType,
    })

    return { 
      key,
      url: result.url,
    }
  }

  async getFileUrl(key: string | null, expireSeconds?: number): Promise<string | null> {
    if (!key) return null

    // 如果配置了使用签名 URL，生成签名 URL
    // 注意：签名 URL 必须使用原始 endpoint，不能替换为 publicUrl，否则签名会失效
    if (this.config.useSignedUrl) {
      const expiresIn = expireSeconds || this.config.urlExpirationSeconds || 3600
      
      try {
        // 生成签名 URL（阿里云 OSS 使用 signatureUrl 方法）
        const signedUrl = this.client.signatureUrl(key, {
          expires: expiresIn,
        })
        return signedUrl
      } catch (error) {
        console.error('生成阿里云 OSS 签名 URL 失败:', error)
        return null
      }
    }

    // 非签名 URL 使用公开 URL（CDN 域名）
    if (this.config.publicUrl) {
      const publicUrl = this.config.publicUrl.replace(/\/$/, '')
      return `${publicUrl}/${key}`
    }

    return null
  }

  async listObjects(continuationToken?: string): Promise<{
    objects: Array<{ key: string; size: number }>
    nextToken?: string
  }> {
    const result = await this.client.list({
      marker: continuationToken,
      'max-keys': 1000,
    })

    const objects = (result.objects || []).map(obj => ({
      key: obj.name,
      size: obj.size,
    }))

    return {
      objects,
      nextToken: result.nextMarker,
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.delete(key)
  }
}
