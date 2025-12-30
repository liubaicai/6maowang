import { requireAuth } from '../../../utils/auth'
import { saveS3Config, getS3Config, testS3Connection, type S3Config } from '../../../utils/s3'
import { logOperation } from '../../../utils/operation-log'

// 保存 S3 配置
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  // 只有管理员可以修改配置
  if (user.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: '无权限修改系统配置',
    })
  }
  
  const body = await readBody(event)
  
  // 验证 provider 字段
  if (body.provider && !['standard-s3', 'aliyun-oss', 'tencent-cos'].includes(body.provider)) {
    throw createError({
      statusCode: 400,
      message: 'provider 必须是 standard-s3、aliyun-oss 或 tencent-cos',
    })
  }
  
  // 验证必填字段
  if (body.enabled) {
    if (!body.endpoint || !body.bucket || !body.accessKeyId) {
      throw createError({
        statusCode: 400,
        message: '启用 S3 时，endpoint、bucket 和 accessKeyId 为必填项',
      })
    }
    
    // 如果使用签名 URL，不需要 publicUrl
    // 如果不使用签名 URL，publicUrl 为必填项
    if (!body.useSignedUrl && !body.publicUrl) {
      throw createError({
        statusCode: 400,
        message: '未启用签名 URL 时，publicUrl 为必填项',
      })
    }
  }
  
  // 处理 secretAccessKey - 如果是 ******** 则保留原值
  const currentConfig = getS3Config()
  const newConfig: Partial<S3Config> = {
    enabled: body.enabled ?? false,
    provider: body.provider || 'standard-s3',
    endpoint: body.endpoint || '',
    region: body.region || 'us-east-1',
    bucket: body.bucket || '',
    accessKeyId: body.accessKeyId || '',
    publicUrl: body.publicUrl || '',
    useSignedUrl: body.useSignedUrl ?? false,
    urlExpirationSeconds: body.urlExpirationSeconds || 3600,
  }
  
  // 如果密钥不是占位符，则更新
  if (body.secretAccessKey && body.secretAccessKey !== '********') {
    newConfig.secretAccessKey = body.secretAccessKey
  } else {
    newConfig.secretAccessKey = currentConfig.secretAccessKey
  }
  
  // 如果启用了 S3，先测试连接
  if (newConfig.enabled) {
    const fullConfig = { ...currentConfig, ...newConfig } as S3Config
    const testResult = await testS3Connection(fullConfig)
    
    if (!testResult.success) {
      throw createError({
        statusCode: 400,
        message: `S3 连接测试失败: ${testResult.message}`,
      })
    }
  }
  
  saveS3Config(newConfig)
  
  // 记录操作日志
  logOperation(user.id, 'update_s3_config', 'system', undefined, {
    enabled: newConfig.enabled,
    endpoint: newConfig.endpoint,
    bucket: newConfig.bucket,
  })
  
  return {
    ok: true,
    message: 'S3 配置已保存',
  }
})
