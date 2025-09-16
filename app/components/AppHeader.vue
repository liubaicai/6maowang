<template>
  <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-2">
          <UIcon name="i-heroicons-camera" class="w-8 h-8 text-amber-500" />
          <span class="font-bold text-xl hidden sm:block">遛猫网</span>
        </NuxtLink>
        
        <!-- 右侧操作 -->
        <div class="flex items-center gap-3">
          <!-- 颜色模式切换 -->
          <UButton
            :icon="mounted ? (colorMode.value === 'dark' ? 'i-heroicons-sun' : 'i-heroicons-moon') : 'i-heroicons-moon'"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="toggleColorMode"
          />
          
          <!-- 未登录 -->
          <template v-if="!session?.authenticated">
            <UButton to="/login" color="primary" variant="soft">
              登录
            </UButton>
          </template>
          
          <!-- 已登录 -->
          <template v-else>
            <UDropdownMenu :items="userMenuItems">
              <template #default="{ open }">
                <UButton color="neutral" variant="ghost" class="gap-2">
                  <UIcon name="i-heroicons-user-circle" class="w-5 h-5" />
                  <span class="hidden sm:inline">{{ session.user?.username }}</span>
                  <UIcon name="i-heroicons-chevron-down" class="w-4 h-4" :class="{ 'rotate-180': open }" />
                </UButton>
              </template>
            </UDropdownMenu>
          </template>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const toast = useToast()

// 用于避免 hydration mismatch
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

// 获取会话状态
const { data: session, refresh } = await useFetch('/api/auth/session')

// 切换颜色模式
const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// 用户菜单
const userMenuItems = [
  [{
    label: '管理后台',
    icon: 'i-heroicons-cog-6-tooth',
    onSelect: () => navigateTo('/admin'),
  }],
  [{
    label: '账户设置',
    icon: 'i-heroicons-user-circle',
    onSelect: () => navigateTo('/admin/account'),
  }],
  [{
    label: '退出登录',
    icon: 'i-heroicons-arrow-right-on-rectangle',
    onSelect: async () => {
      await $fetch('/api/auth/logout', { method: 'POST' })
      toast.add({ title: '已退出登录', color: 'success' })
      await refresh()
      navigateTo('/')
    },
  }],
]
</script>
