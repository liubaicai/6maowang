export default defineEventHandler(async (event) => {
  // 清除 Session
  await clearUserSession(event)
  
  return { ok: true }
})
