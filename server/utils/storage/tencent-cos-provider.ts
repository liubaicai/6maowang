/**
 * Tencent Cloud COS Provider Implementation
 * 腾讯云 COS 对象存储实现
 * 
 * 使用官方 SDK：cos-nodejs-sdk-v5
 * 文档：https://cloud.tencent.com/document/product/436/8629
 */

import COS from 'cos-nodejs-sdk-v5'
import { readFileSync } from 'node:fs'
import type { IStorageProvider, StorageConfig, UploadResult } from './types'

export class TencentCOSProvider implements IStorageProvider {
  private client: COS
  private config: StorageConfig
  private bucket: string
  private region: string

  constructor(config: StorageConfig) {
    this.config = config
    this.region = config.region // 例如: ap-guangzhou, ap-shanghai, ap-beijing
    this.bucket = config.bucket // 格式: bucketname-appid
    
    // 初始化腾讯云 COS 客户端
    this.client = new COS({
      SecretId: config.accessKeyId,
      SecretKey: config.secretAccessKey,
    })
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      this.client.headBucket({
        Bucket: this.bucket,
        Region: this.region,
      }, (err) => {
        if (err) {
          console.error('腾讯云 COS 连接测试失败:', err)
          resolve({ success: false, message: err.message || '腾讯云 COS 连接失败' })
        } else {
          resolve({ success: true, message: '腾讯云 COS 连接成功' })
        }
      })
    })
  }

  async checkObjectExists(key: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.client.headObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
      }, (err) => {
        if (err) {
          // 404 表示文件不存在
          resolve(false)
        } else {
          resolve(true)
        }
      })
    })
  }

  async uploadFile(localPath: string, key: string, contentType: string): Promise<UploadResult> {
    // 读取文件内容
    const fileBuffer = readFileSync(localPath)
    
    return new Promise((resolve, reject) => {
      this.client.putObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve({ key })
        }
      })
    })
  }

  async getFileUrl(key: string | null, expireSeconds?: number): Promise<string | null> {
    if (!key) return null

    // 如果配置了使用签名 URL，生成预签名 URL
    if (this.config.useSignedUrl) {
      const expires = expireSeconds || this.config.urlExpirationSeconds || 3600
      
      return new Promise((resolve) => {
        // 使用 getObjectUrl 生成带签名的 URL
        // 关键：如果配置了 publicUrl（自定义域名），使用 Domain 参数生成正确的签名
        const options: any = {
          Bucket: this.bucket,
          Region: this.region,
          Key: key,
          Sign: true,
          Expires: expires,
        }
        
        // 如果配置了自定义域名，设置 Domain 参数
        if (this.config.publicUrl) {
          try {
            const url = new URL(this.config.publicUrl)
            options.Domain = url.host
            options.Protocol = url.protocol
          } catch {
            // URL 解析失败，使用默认域名
          }
        }
        
        this.client.getObjectUrl(options, (err, data) => {
          if (err) {
            console.error('生成腾讯云 COS 签名 URL 失败:', err)
            resolve(null)
          } else {
            resolve(data.Url)
          }
        })
      })
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
    return new Promise((resolve, reject) => {
      this.client.getBucket({
        Bucket: this.bucket,
        Region: this.region,
        Marker: continuationToken || '',
        MaxKeys: 1000,
      }, (err, data) => {
        if (err) {
          reject(err)
        } else {
          const objects = (data.Contents || []).map((obj: any) => ({
            key: obj.Key || '',
            size: parseInt(obj.Size) || 0,
          }))

          resolve({
            objects,
            nextToken: data.IsTruncated === 'true' ? data.NextMarker : undefined,
          })
        }
      })
    })
  }

  async deleteObject(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.deleteObject({
        Bucket: this.bucket,
        Region: this.region,
        Key: key,
      }, (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}
