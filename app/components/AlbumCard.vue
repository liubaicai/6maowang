<template>
  <NuxtLink 
    :to="`/albums/${album.id}`" 
    class="album-card group block bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800"
  >
    <!-- 封面图 -->
    <div class="aspect-[4/3] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
      <img
        v-if="album.coverThumb"
        :src="`/api/uploads/thumbs/${album.coverThumb}`"
        :alt="album.name"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      <div 
        v-else 
        class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600"
      >
        <UIcon name="i-heroicons-photo" class="w-16 h-16" />
      </div>
      <!-- 私有相册标记 -->
      <div 
        v-if="album.isPublic === 0"
        class="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs"
      >
        <UIcon name="i-heroicons-lock-closed" class="w-3 h-3" />
        <span>私有</span>
      </div>
    </div>
    
    <!-- 信息 -->
    <div class="p-4">
      <h3 class="font-semibold text-gray-900 dark:text-white truncate">
        {{ album.name }}
      </h3>
      <p 
        v-if="album.description" 
        class="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
      >
        {{ album.description }}
      </p>
      <p 
        v-else 
        class="mt-1 text-sm text-gray-400 dark:text-gray-500"
      >
        暂无描述
      </p>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Album {
  id: number
  name: string
  description?: string
  coverThumb?: string | null
  isPublic?: number
}

defineProps<{
  album: Album
}>()
</script>
