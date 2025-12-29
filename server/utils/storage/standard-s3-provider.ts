/**
 * Standard S3 Provider Implementation
 * 标准 S3 协议实现（兼容 AWS S3、MinIO 等）
 */

import { 
  S3Client, 
  PutObjectCommand, 
  HeadBucketCommand, 
  HeadObjectCommand, 
  ListObjectsV2Command, 
  DeleteObjectCommand,
  GetObjectCommand
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Upload } from '@aws-sdk/lib-storage'
import { readFileSync } from 'node:fs'
import type { IStorageProvider, StorageConfig, UploadResult } from './types'

export class StandardS3Provider implements IStorageProvider {
  private client: S3Client
  private config: StorageConfig

  constructor(config: StorageConfig) {
    this.config = config
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true, // 兼容 MinIO 等自建存储
    })
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.config.bucket }))
      return { success: true, message: 'S3 连接成功' }
    } catch (error: any) {
      console.error('S3 连接测试失败:', error)
      return { success: false, message: error.message || 'S3 连接失败' }
    }
  }

  async checkObjectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }))
      return true
    } catch (error: any) {
      // 404 表示文件不存在
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false
      }
      // 其他错误也当作不存在处理
      return false
    }
  }

  async uploadFile(localPath: string, key: string, contentType: string): Promise<UploadResult> {
    // 统一使用 Buffer 读取，避免文件流导致的文件描述符问题
    const fileBuffer = readFileSync(localPath)
    
    // 对于大文件（>5MB）使用分片上传
    if (fileBuffer.length > 5 * 1024 * 1024) {
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.config.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
        },
      })
      await upload.done()
    } else {
      await this.client.send(new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      }))
    }

    return { key }
  }

  async getFileUrl(key: string | null, expireSeconds?: number): Promise<string | null> {
    if (!key) return null

    // 如果配置了使用签名 URL，生成预签名 URL
    if (this.config.useSignedUrl) {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })

      const expiresIn = expireSeconds || this.config.urlExpirationSeconds || 3600
      const signedUrl = await getSignedUrl(this.client, command, { expiresIn })
      return signedUrl
    }

    // 否则使用公开 URL
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
    const response = await this.client.send(new ListObjectsV2Command({
      Bucket: this.config.bucket,
      ContinuationToken: continuationToken,
    }))

    const objects = (response.Contents || []).map(obj => ({
      key: obj.Key || '',
      size: obj.Size || 0,
    }))

    return {
      objects,
      nextToken: response.NextContinuationToken,
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    }))
  }
}
