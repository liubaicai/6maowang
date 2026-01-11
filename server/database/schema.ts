import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// 用户表
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nickname: text('nickname'), // 昵称（可选）
  role: text('role').notNull().default('admin'), // 用户角色：admin 或 user
  createdAt: text('created_at').notNull(),
})

// 相册表
export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').default(''),
  coverPhotoId: integer('cover_photo_id'),
  isPublic: integer('is_public').notNull().default(1), // 是否公开（1=公开，0=私有，默认公开）
  createdBy: integer('created_by'), // 创建者用户ID（可选，保持向后兼容）
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// 照片表
export const photos = sqliteTable('photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  albumId: integer('album_id').notNull().references(() => albums.id, { onDelete: 'cascade' }),
  originalFilename: text('original_filename').notNull(),
  storedFilename: text('stored_filename').notNull(),
  thumbnailFilename: text('thumbnail_filename').notNull(),
  mimeType: text('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  exifJson: text('exif_json'),
  shotAt: text('shot_at'),
  s3OriginalUrl: text('s3_original_url'), // S3 原图 URL
  s3ThumbnailUrl: text('s3_thumbnail_url'), // S3 缩略图 URL
  s3UploadedAt: text('s3_uploaded_at'), // S3 上传时间
  isSlideshow: integer('is_slideshow').notNull().default(0), // 是否参与轮播（1=是，0=否，默认不参与）
  createdBy: integer('created_by'), // 创建者用户ID（可选，保持向后兼容）
  deletedAt: text('deleted_at'), // 软删除时间戳（null 表示未删除）
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
})

// 系统配置表
export const systemSettings = sqliteTable('system_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  value: text('value'),
  updatedAt: text('updated_at').notNull(),
})

// 令牌表（用于 App 端 Token 认证）
export const tokens = sqliteTable('tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  deviceInfo: text('device_info').default(''),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
})

// 操作日志表（记录用户操作）
export const operationLogs = sqliteTable('operation_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(), // 操作类型：create_album, upload_photo, delete_photo, delete_album 等
  resourceType: text('resource_type').notNull(), // 资源类型：album, photo, user 等
  resourceId: integer('resource_id'), // 资源ID（可选）
  details: text('details'), // 操作详情（JSON字符串）
  createdAt: text('created_at').notNull(),
})

// 类型导出
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Album = typeof albums.$inferSelect
export type NewAlbum = typeof albums.$inferInsert
export type Photo = typeof photos.$inferSelect
export type NewPhoto = typeof photos.$inferInsert
export type Token = typeof tokens.$inferSelect
export type NewToken = typeof tokens.$inferInsert
export type OperationLog = typeof operationLogs.$inferSelect
export type NewOperationLog = typeof operationLogs.$inferInsert
export type SystemSetting = typeof systemSettings.$inferSelect
export type NewSystemSetting = typeof systemSettings.$inferInsert
