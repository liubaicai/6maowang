export default defineNuxtRouteMiddleware(async (to) => {
  // 只在客户端检查
  if (import.meta.server) return
  
  const { data } = await useFetch('/api/auth/session')
  
  if (!data.value?.authenticated) {
    return navigateTo('/login')
  }
})
