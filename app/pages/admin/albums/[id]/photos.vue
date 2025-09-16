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
      <h2 class="text-lg font-semibold">{{ album?.name }} - 照片管理</h2>
    </div>
    
    <!-- 上传区域 -->
    <UCard class="mb-6">
      <template #header>
        <h3 class="font-semibold">上传照片</h3>
      </template>
      <PhotoUploader :album-id="Number(albumId)" @uploaded="refreshPhotos" />
    </UCard>
    
    <!-- 照片列表 -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold">照片列表 ({{ photos?.length || 0 }})</h3>
        </div>
      </template>
      
      <div v-if="photosPending" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
      </div>
      
      <EmptyState
        v-else-if="!photos || photos.length === 0"
        icon="🖼️"
        title="还没有照片"
        description="使用上方的上传区域添加照片"
      />
      
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <PhotoCard
          v-for="photo in photos"
          :key="photo.id"
          :photo="photo"
          show-actions
          @view="viewPhoto(photo)"
          @set-cover="setCover(photo)"
          @rename="openRenameModal(photo)"
          @delete="confirmDelete(photo)"
        />
      </div>
    </UCard>
    
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
  window.open(`/api/uploads/originals/${photo.storedFilename}`, '_blank')
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
