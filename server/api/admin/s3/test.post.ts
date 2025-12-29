import { requireAuth } from '../../../utils/auth'
import { getS3Config, testS3Connection, type S3Config } from '../../../utils/s3'

// 测试 S3 连接
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const body = await readBody(event)
  
  // 获取当前配置作为基础
  const currentConfig = getS3Config()
  
  // 合并测试配置
  const testConfig: S3Config = {
    enabled: true,
    endpoint: body.endpoint || currentConfig.endpoint,
    region: body.region || currentConfig.region || 'us-east-1',
    bucket: body.bucket || currentConfig.bucket,
    accessKeyId: body.accessKeyId || currentConfig.accessKeyId,
    secretAccessKey: body.secretAccessKey === '********' 
      ? currentConfig.secretAccessKey 
      : (body.secretAccessKey || currentConfig.secretAccessKey),
    publicUrl: body.publicUrl || currentConfig.publicUrl,
  }
  
  // 验证必填字段
  if (!testConfig.endpoint || !testConfig.bucket || !testConfig.accessKeyId || !testConfig.secretAccessKey) {
    throw createError({
      statusCode: 400,
      message: '请填写完整的 S3 配置信息',
    })
  }
  
  const result = await testS3Connection(testConfig)
  
  return {
    ok: result.success,
    message: result.message,
  }
})
