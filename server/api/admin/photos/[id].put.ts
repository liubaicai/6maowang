import { db, schema } from '../../../database'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/auth'
import { logOperation } from '../../../utils/operation-log'

export default defineEventHandler(async (event) => {
  // 验证管理员权限
  const user = await requireAdmin(event)

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '照片 ID 不能为空',
    })
  }

  // 获取照片信息
  const photo = db
    .select()
    .from(schema.photos)
    .where(eq(schema.photos.id, Number(id)))
    .get()

  if (!photo) {
    throw createError({
      statusCode: 404,
      message: '照片不存在',
    })
  }

  // 获取请求体
  const body = await readBody(event)
  const { isSlideshow } = body

  // 验证参数
  if (typeof isSlideshow !== 'boolean' && typeof isSlideshow !== 'number') {
    throw createError({
      statusCode: 400,
      message: '参数错误',
    })
  }

  const now = new Date().toISOString()
  const slideshowValue = isSlideshow ? 1 : 0

  // 更新照片轮播状态
  db.update(schema.photos)
    .set({
      isSlideshow: slideshowValue,
      updatedAt: now,
    })
    .where(eq(schema.photos.id, Number(id)))
    .run()

  // 记录操作日志
  logOperation(user.id, 'update_photo_slideshow', 'photo', Number(id), {
    filename: photo.originalFilename,
    isSlideshow: slideshowValue,
  })

  return {
    ok: true,
    message: slideshowValue ? '已设置为轮播' : '已取消轮播',
  }
})
