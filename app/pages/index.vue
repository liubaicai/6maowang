<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-8" style="display: none;">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">相册</h1>
      <p class="mt-2 text-gray-500 dark:text-gray-400">浏览所有精彩瞬间</p>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="status === 'pending'" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center py-16">
      <p class="text-red-500">加载失败: {{ error.message }}</p>
      <UButton class="mt-4" @click="refresh">重试</UButton>
    </div>
    
    <!-- 空状态 -->
    <EmptyState
      v-else-if="!albums || albums.length === 0"
      icon="📷"
      title="还没有相册"
      description="登录后可以创建你的第一个相册"
    >
      <template #action>
        <UButton to="/login" color="primary">去登录</UButton>
      </template>
    </EmptyState>
    
    <!-- 相册网格 -->
    <div 
      v-else 
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <AlbumCard
        v-for="album in albums"
        :key="album.id"
        :album="album"
      />
    </div>

    <!-- 浮动幻灯片按钮 -->
    <UButton
      v-if="albums && albums.length > 0"
      icon="i-heroicons-play-circle"
      size="xl"
      color="primary"
      class="fixed bottom-8 right-8 shadow-2xl hover:scale-110 transition-transform z-40"
      @click="navigateTo('/slideshow')"
      aria-label="播放幻灯片"
    >
      幻灯片
    </UButton>
  </div>
</template>

<script setup lang="ts">
// SEO
useSeoMeta({
  title: '相册 - 遛猫网',
})

// 获取相册列表
const { data: albums, status, error, refresh } = await useFetch('/api/albums')
</script>
