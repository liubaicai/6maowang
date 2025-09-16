<template>
  <div>
    <!-- 返回按钮 + 标题 -->
    <div class="mb-8">
      <NuxtLink 
        to="/" 
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        返回相册列表
      </NuxtLink>
      
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        {{ album?.name || '加载中...' }}
      </h1>
      <p v-if="album?.description" class="mt-2 text-gray-500 dark:text-gray-400">
        {{ album.description }}
      </p>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="photosPending" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>
    
    <!-- 空状态 -->
    <EmptyState
      v-else-if="!photos || photos.length === 0"
      icon="🖼️"
      title="相册还是空的"
      description="这个相册里还没有照片"
    />
    
    <!-- 照片网格 -->
    <div 
      v-else 
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <PhotoCard
        v-for="(photo, index) in photos"
        :key="photo.id"
        :photo="photo"
        @view="openLightbox(index)"
      />
    </div>
    
    <!-- 灯箱 -->
    <UModal v-model:open="lightboxOpen" fullscreen>
      <template #content>
        <div class="relative w-full h-full flex items-center justify-center bg-black">
          <!-- 关闭按钮 -->
          <UButton
            icon="i-heroicons-x-mark"
            color="neutral"
            variant="ghost"
            class="absolute top-4 right-4 z-10 text-white"
            @click="lightboxOpen = false"
          />
          
          <!-- 上一张 -->
          <UButton
            v-if="currentIndex > 0"
            icon="i-heroicons-chevron-left"
            color="neutral"
            variant="ghost"
            class="absolute left-4 z-10 text-white"
            size="xl"
            @click="currentIndex--"
          />
          
          <!-- 图片 -->
          <img
            v-if="currentPhoto"
            :src="`/api/uploads/originals/${currentPhoto.storedFilename}`"
            :alt="currentPhoto.displayName"
            class="max-w-full max-h-full object-contain"
          />
          
          <!-- 下一张 -->
          <UButton
            v-if="currentIndex < (photos?.length || 0) - 1"
            icon="i-heroicons-chevron-right"
            color="neutral"
            variant="ghost"
            class="absolute right-4 z-10 text-white"
            size="xl"
            @click="currentIndex++"
          />
          
          <!-- 底部信息 -->
          <div 
            v-if="currentPhoto"
            class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6"
          >
            <h3 class="text-white font-medium">{{ currentPhoto.displayName }}</h3>
            <p v-if="currentPhoto.exifSummary" class="text-gray-300 text-sm mt-1">
              {{ currentPhoto.exifSummary }}
            </p>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const albumId = route.params.id

// 获取相册信息
const { data: album } = await useFetch(`/api/albums/${albumId}`)

// 获取照片列表
const { data: photos, pending: photosPending } = await useFetch(`/api/photos/album/${albumId}`)

// SEO
useSeoMeta({
  title: () => `${album.value?.name || '相册'} - 遛猫网`,
})

// 灯箱状态
const lightboxOpen = ref(false)
const currentIndex = ref(0)

const currentPhoto = computed(() => {
  if (!photos.value || !lightboxOpen.value) return null
  return photos.value[currentIndex.value]
})

const openLightbox = (index: number) => {
  currentIndex.value = index
  lightboxOpen.value = true
}

// 键盘导航
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if (!lightboxOpen.value) return
    
    if (e.key === 'ArrowLeft' && currentIndex.value > 0) {
      currentIndex.value--
    } else if (e.key === 'ArrowRight' && currentIndex.value < (photos.value?.length || 0) - 1) {
      currentIndex.value++
    } else if (e.key === 'Escape') {
      lightboxOpen.value = false
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
})
</script>
