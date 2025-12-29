import { requireAuth } from '../../../utils/auth'
import { getS3StorageStats } from '../../../utils/s3'

// 获取 S3 存储统计
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  
  const stats = await getS3StorageStats()
  
  return stats
})
