<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-950">
    <!-- 侧边栏 -->
    <aside class="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0">
      <div class="h-full flex flex-col">
        <!-- Logo -->
        <div class="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <NuxtLink to="/" class="flex items-center gap-2">
            <UIcon name="i-heroicons-camera" class="w-8 h-8 text-primary-500" />
            <span class="font-bold text-lg">遛猫网</span>
          </NuxtLink>
        </div>
        
        <!-- 导航菜单 -->
        <nav class="flex-1 p-4 space-y-1">
          <NuxtLink
            v-for="item in menuItems"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            active-class="!bg-primary-50 dark:!bg-primary-950 !text-primary-600 dark:!text-primary-400"
          >
            <UIcon :name="item.icon" class="w-5 h-5" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </nav>
        
        <!-- 底部操作 -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-800">
          <div class="flex items-center justify-between mb-3">
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-medium truncate">{{ session?.user?.nickname || session?.user?.username }}</span>
              <span class="text-xs text-gray-500">@{{ session?.user?.username }}</span>
            </div>
            <UButton
              icon="i-heroicons-arrow-right-on-rectangle"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="handleLogout"
            />
          </div>
          <div class="flex items-center gap-2">
            <UButton
              :icon="mounted ? (colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon') : 'i-heroicons-moon'"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="toggleColorMode"
            />
            <NuxtLink to="/" class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              返回前台
            </NuxtLink>
          </div>
        </div>
      </div>
    </aside>
    
    <!-- 主内容区 -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- 顶栏 -->
      <header class="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center">
        <h1 class="text-xl font-semibold">{{ pageTitle }}</h1>
      </header>
      
      <!-- 内容 -->
      <main class="flex-1 p-6 overflow-auto">
        <slot />
      </main>
    </div>
    
    <!-- 通知 -->
    <UToaster />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const colorMode = useColorMode()
const toast = useToast()

// 用于避免 hydration mismatch
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

// 获取会话
const { data: session } = await useFetch('/api/auth/session')

// 菜单项（根据角色显示）
const menuItems = computed(() => {
  const items = [
    { to: '/admin', icon: 'i-heroicons-home', label: '仪表盘' },
    { to: '/admin/albums', icon: 'i-heroicons-folder', label: '相册管理' },
    { to: '/admin/photos', icon: 'i-heroicons-photo', label: '照片管理' },
  ]
  
  // 仅管理员可见的菜单
  if (session.value?.user?.role === 'admin') {
    items.push(
      { to: '/admin/users', icon: 'i-heroicons-users', label: '用户管理' },
      { to: '/admin/storage', icon: 'i-heroicons-cloud', label: 'S3 存储' },
      { to: '/admin/logs', icon: 'i-heroicons-document-text', label: '操作日志' }
    )
  }
  
  items.push({ to: '/admin/account', icon: 'i-heroicons-user-circle', label: '账户设置' })
  
  return items
})

// 页面标题
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/admin': '仪表盘',
    '/admin/albums': '相册管理',
    '/admin/albums/new': '新建相册',
    '/admin/photos': '照片管理',
    '/admin/users': '用户管理',
    '/admin/storage': 'S3 存储配置',
    '/admin/logs': '操作日志',
    '/admin/account': '账户设置',
  }
  return titles[route.path] || '管理后台'
})

// 切换颜色模式
const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// 登出
const handleLogout = async () => {
  await $fetch('/api/auth/logout', { method: 'POST' })
  toast.add({ title: '已退出登录', color: 'success' })
  navigateTo('/login')
}
</script>
