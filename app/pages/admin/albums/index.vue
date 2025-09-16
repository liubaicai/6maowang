<template>
  <div>
    <!-- 操作栏 -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold">所有相册</h2>
      <UButton to="/admin/albums/new" color="primary">
        <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
        新建相册
      </UButton>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="status === 'pending'" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>
    
    <!-- 空状态 -->
    <EmptyState
      v-else-if="!albums || albums.length === 0"
      icon="📁"
      title="还没有相册"
      description="点击上方按钮创建第一个相册"
    />
    
    <!-- 相册列表 -->
    <div v-else class="space-y-4">
      <UCard
        v-for="album in albums"
        :key="album.id"
        class="hover:shadow-md transition-shadow"
      >
        <div class="flex items-center gap-4">
          <!-- 封面 -->
          <div class="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            <img
              v-if="album.coverThumb"
              :src="`/api/uploads/thumbs/${album.coverThumb}`"
              :alt="album.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-photo" class="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 dark:text-white">{{ album.name }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
              {{ album.description || '暂无描述' }}
            </p>
          </div>
          
          <!-- 操作 -->
          <div class="flex items-center gap-2">
            <UButton
              :to="`/admin/albums/${album.id}/photos`"
              color="primary"
              variant="soft"
              size="sm"
            >
              管理照片
            </UButton>
            <UButton
              :to="`/admin/albums/${album.id}/edit`"
              color="neutral"
              variant="soft"
              size="sm"
            >
              编辑
            </UButton>
            <UButton
              color="error"
              variant="soft"
              size="sm"
              @click="confirmDelete(album)"
            >
              删除
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
    
    <!-- 删除确认对话框 -->
    <UModal v-model:open="deleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold">确认删除</h3>
          </template>
          
          <p>确定要删除相册「{{ albumToDelete?.name }}」吗？</p>
          <p class="text-sm text-gray-500 mt-2">此操作将同时删除相册内的所有照片，且不可恢复。</p>
          
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
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useSeoMeta({
  title: '相册管理 - 管理后台',
})

const toast = useToast()

// 获取相册列表
const { data: albums, status, refresh } = await useFetch('/api/albums')

// 删除相关
const deleteModalOpen = ref(false)
const albumToDelete = ref<any>(null)
const deleting = ref(false)

const confirmDelete = (album: any) => {
  albumToDelete.value = album
  deleteModalOpen.value = true
}

const handleDelete = async () => {
  if (!albumToDelete.value) return
  
  deleting.value = true
  
  try {
    await $fetch(`/api/albums/${albumToDelete.value.id}`, {
      method: 'DELETE',
    })
    
    toast.add({ title: '删除成功', color: 'success' })
    deleteModalOpen.value = false
    await refresh()
  } catch (err: any) {
    toast.add({ 
      title: '删除失败', 
      description: err.message,
      color: 'error' 
    })
  } finally {
    deleting.value = false
  }
}
</script>
