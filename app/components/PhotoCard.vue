<template>
  <div 
    class="photo-card group bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800"
  >
    <!-- 缩略图 -->
    <div 
      class="aspect-[4/3] relative overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
      @click="$emit('view', photo)"
    >
      <img
        :src="`/api/uploads/thumbs/${photo.thumbnailFilename}`"
        :alt="photo.displayName"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
    </div>
    
    <!-- 信息 -->
    <div class="p-3">
      <h4 class="font-medium text-sm text-gray-900 dark:text-white truncate">
        {{ photo.displayName }}
      </h4>
      <p 
        v-if="photo.exifSummary" 
        class="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate"
      >
        {{ photo.exifSummary }}
      </p>
    </div>
    
    <!-- 管理操作 -->
    <div v-if="showActions" class="px-3 pb-3 flex gap-2">
      <UButton 
        size="xs" 
        color="neutral" 
        variant="soft"
        @click="$emit('setCover', photo)"
      >
        设为封面
      </UButton>
      <UButton 
        size="xs" 
        color="neutral" 
        variant="soft"
        @click="$emit('rename', photo)"
      >
        重命名
      </UButton>
      <UButton 
        size="xs" 
        color="error" 
        variant="soft"
        @click="$emit('delete', photo)"
      >
        删除
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Photo {
  id: number
  thumbnailFilename: string
  storedFilename: string
  displayName: string
  exifSummary?: string
}

defineProps<{
  photo: Photo
  showActions?: boolean
}>()

defineEmits<{
  view: [photo: Photo]
  setCover: [photo: Photo]
  rename: [photo: Photo]
  delete: [photo: Photo]
}>()
</script>
