import { requireAuth } from '../../../utils/auth'
import { getS3Config } from '../../../utils/s3'

// 获取 S3 配置（隐藏敏感信息）
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const config = getS3Config()
  
  // 隐藏 secret key 的具体值
  return {
    enabled: config.enabled,
    provider: config.provider,
    endpoint: config.endpoint,
    region: config.region,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey ? '********' : '',
    publicUrl: config.publicUrl,
    useSignedUrl: config.useSignedUrl,
    urlExpirationSeconds: config.urlExpirationSeconds,
  }
})
