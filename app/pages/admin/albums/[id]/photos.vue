<template>
  <div>
    <!-- 相册信息 -->
    <div class="mb-6">
      <NuxtLink 
        to="/admin/albums" 
        class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
      >
        <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
        返回相册列表
      </NuxtLink>
      <h2 class="text-lg font-semibold">{{ album?.name }} - 照片管理 ({{ photos?.length || 0 }})</h2>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="photosPending" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>
    
    <!-- 照片列表（包含上传区域） -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <!-- 上传区域作为第一项 -->
      <div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        <div class="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
          <UIcon name="i-heroicons-cloud-arrow-up" class="w-10 h-10 text-gray-400" />
        </div>
        <div class="flex-1 min-w-0">
          <PhotoUploader :album-id="Number(albumId)" compact @uploaded="refreshPhotos" />
        </div>
      </div>
      
      <!-- 照片列表项 -->
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all"
      >
        <!-- 缩略图 -->
        <div 
          class="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 cursor-pointer"
          @click="viewPhoto(photo)"
        >
          <img
            :src="photo.thumbnailUrl || `/api/uploads/thumbs/${photo.thumbnailFilename}`"
            :alt="photo.displayName"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          
          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 dark:text-white truncate">
              {{ photo.displayName }}
            </h4>
            <p 
              v-if="photo.exifSummary" 
              class="text-sm text-gray-500 dark:text-gray-400 truncate mt-1"
            >
              {{ photo.exifSummary }}
            </p>
            <!-- 操作 -->
            <div class="flex items-center gap-1 mt-2">
              <UButton 
                size="xs" 
                color="neutral" 
                variant="soft"
                @click="setCover(photo)"
            >
              设为封面
            </UButton>
            <UButton 
              size="xs" 
              color="neutral" 
              variant="soft"
              @click="openRenameModal(photo)"
            >
              重命名
            </UButton>
            <UButton 
              size="xs" 
              color="error" 
              variant="soft"
              @click="confirmDelete(photo)"
            >
              删除
            </UButton>
            </div>
          </div>
        </div>
      </div>
    
    <!-- 重命名对话框 -->
    <UModal v-model:open="renameModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold">重命名照片</h3>
          </template>
          
          <div>
            <label class="block text-sm font-medium mb-1">照片名称</label>
            <UInput v-model="newPhotoName" placeholder="请输入新名称" class="w-full" />
          </div>
          
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="renameModalOpen = false">
                取消
              </UButton>
              <UButton color="primary" :loading="renaming" @click="handleRename">
                保存
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
    
    <!-- 删除确认对话框 -->
    <UModal v-model:open="deleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold">确认删除</h3>
          </template>
          
          <p>确定要删除这张照片吗？此操作不可恢复。</p>
          
          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="deleteModalOpen = false">
                取消
              </UButton>
              <UButton color="error" :loading="deleting" @click="handleDelete">
                确认删除
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const albumId = route.params.id

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useSeoMeta({
  title: '照片管理 - 管理后台',
})

const toast = useToast()

// 获取相册信息
const { data: album } = await useFetch(`/api/albums/${albumId}`)

// 获取照片列表
const { data: photos, pending: photosPending, refresh: refreshPhotos } = await useFetch(`/api/photos/album/${albumId}`)

// 查看原图
const viewPhoto = (photo: any) => {
  const url = photo.originalUrl || `/api/uploads/originals/${photo.storedFilename}`
  window.open(url, '_blank')
}

// 设置封面
const setCover = async (photo: any) => {
  try {
    await $fetch(`/api/albums/${albumId}/cover`, {
      method: 'POST',
      body: { photoId: photo.id },
    })
    toast.add({ title: '封面设置成功', color: 'success' })
  } catch (err: any) {
    toast.add({ title: '设置失败', description: err.message, color: 'error' })
  }
}

// 重命名相关
const renameModalOpen = ref(false)
const photoToRename = ref<any>(null)
const newPhotoName = ref('')
const renaming = ref(false)

const openRenameModal = (photo: any) => {
  photoToRename.value = photo
  newPhotoName.value = photo.displayName || photo.originalFilename.replace(/\.[^.]+$/, '')
  renameModalOpen.value = true
}

const handleRename = async () => {
  if (!photoToRename.value || !newPhotoName.value.trim()) return
  
  renaming.value = true
  
  try {
    // 保留原扩展名
    const ext = photoToRename.value.originalFilename.match(/\.[^.]+$/)?.[0] || '.jpg'
    const newFilename = newPhotoName.value.trim() + ext
    
    await $fetch(`/api/photos/${photoToRename.value.id}`, {
      method: 'PUT',
      body: { originalFilename: newFilename },
    })
    
    toast.add({ title: '重命名成功', color: 'success' })
    renameModalOpen.value = false
    await refreshPhotos()
  } catch (err: any) {
    toast.add({ title: '重命名失败', description: err.message, color: 'error' })
  } finally {
    renaming.value = false
  }
}

// 删除相关
const deleteModalOpen = ref(false)
const photoToDelete = ref<any>(null)
const deleting = ref(false)

const confirmDelete = (photo: any) => {
  photoToDelete.value = photo
  deleteModalOpen.value = true
}

const handleDelete = async () => {
  if (!photoToDelete.value) return
  
  deleting.value = true
  
  try {
    await $fetch(`/api/photos/${photoToDelete.value.id}`, {
      method: 'DELETE',
    })
    
    toast.add({ title: '删除成功', color: 'success' })
    deleteModalOpen.value = false
    await refreshPhotos()
  } catch (err: any) {
    toast.add({ title: '删除失败', description: err.message, color: 'error' })
  } finally {
    deleting.value = false
  }
}
</script>
