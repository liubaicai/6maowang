<template>
  <div>
    <!-- 操作栏 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-semibold">所有照片</h2>
        <span v-if="pagination" class="text-sm text-gray-500">
          共 {{ pagination.total }} 张
        </span>
      </div>
      <div class="flex items-center gap-3">
        <UCheckbox v-model="showDeleted" label="显示已删除" />
        <USelectMenu
          v-model="pageSize"
          :items="pageSizeOptions"
          value-key="value"
          class="w-28"
        />
      </div>
    </div>

    <!-- 批量操作栏 -->
    <div 
      v-if="selectedIds.length > 0" 
      class="mb-4 p-3 bg-primary-50 dark:bg-primary-950 rounded-lg flex items-center justify-between"
    >
      <span class="text-sm">
        已选择 <strong>{{ selectedIds.length }}</strong> 张照片
      </span>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-play"
          size="sm"
          color="success"
          variant="soft"
          @click="batchSetSlideshow(true)"
        >
          设为轮播
        </UButton>
        <UButton
          icon="i-heroicons-pause"
          size="sm"
          color="warning"
          variant="soft"
          @click="batchSetSlideshow(false)"
        >
          取消轮播
        </UButton>
        <UButton
          icon="i-heroicons-trash"
          size="sm"
          color="error"
          variant="soft"
          @click="confirmBatchDelete"
        >
          批量删除
        </UButton>
        <UButton
          size="sm"
          color="neutral"
          variant="ghost"
          @click="clearSelection"
        >
          取消选择
        </UButton>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="status === 'pending'" class="flex justify-center py-16">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
    </div>

    <!-- 空状态 -->
    <EmptyState
      v-else-if="photos.length === 0"
      icon="📷"
      title="还没有照片"
      description="去相册中上传照片吧"
    />

    <!-- 照片列表 -->
    <div v-else class="space-y-2">
      <!-- 全选 -->
      <div class="flex items-center gap-3 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UCheckbox
          :model-value="isAllSelected"
          :indeterminate="isPartialSelected"
          @update:model-value="(val: any) => toggleSelectAll(val)"
        />
        <span class="text-sm text-gray-500">全选当前页</span>
      </div>

      <!-- 列表项 -->
      <UCard
        v-for="photo in photos"
        :key="photo.id"
        class="hover:shadow-md transition-shadow"
        :class="{ 'opacity-60 bg-red-50 dark:bg-red-950/20': photo.isDeleted }"
      >
        <div class="flex items-center gap-4">
          <!-- 选择框 -->
          <UCheckbox
            :model-value="selectedIds.includes(photo.id)"
            @update:model-value="toggleSelect(photo.id)"
          />

          <!-- 缩略图 -->
          <div class="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            <img
              :src="photo.thumbnailUrl"
              :alt="photo.originalFilename"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-gray-900 dark:text-white truncate">
                {{ photo.originalFilename }}
              </h3>
              <!-- 状态标签 -->
              <UBadge v-if="photo.isSlideshow" color="success" variant="soft" size="xs">
                轮播中
              </UBadge>
              <UBadge v-if="photo.isDeleted" color="error" variant="soft" size="xs">
                已删除
              </UBadge>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              相册: {{ photo.albumName || '未知' }}
              <span class="mx-2">•</span>
              {{ formatDate(photo.createdAt) }}
            </p>
          </div>

          <!-- 操作 -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <template v-if="!photo.isDeleted">
              <UButton
                v-if="photo.isSlideshow"
                icon="i-heroicons-pause"
                color="warning"
                variant="soft"
                size="sm"
                @click="toggleSlideshow(photo)"
              >
                取消轮播
              </UButton>
              <UButton
                v-else
                icon="i-heroicons-play"
                color="success"
                variant="soft"
                size="sm"
                @click="toggleSlideshow(photo)"
              >
                设为轮播
              </UButton>
              <UButton
                icon="i-heroicons-trash"
                color="error"
                variant="soft"
                size="sm"
                @click="confirmDelete(photo)"
              >
                删除
              </UButton>
            </template>
            <template v-else>
              <UButton
                icon="i-heroicons-trash"
                color="error"
                variant="solid"
                size="sm"
                @click="confirmCleanup(photo)"
              >
                清理
              </UButton>
            </template>
          </div>
        </div>
      </UCard>

      <!-- 分页 -->
      <div v-if="pagination && pagination.totalPages > 1" class="mt-6 flex justify-center">
        <UPagination
          v-model:page="currentPage"
          :total="pagination.total"
          :items-per-page="pagination.limit"
        />
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <UModal v-model:open="deleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold">确认删除</h3>
          </template>

          <p>确定要删除照片「{{ photoToDelete?.originalFilename }}」吗？</p>
          <p class="text-sm text-gray-500 mt-2">
            照片将被标记为已删除，可在照片管理中彻底清理。
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="deleteModalOpen = false">
                取消
              </UButton>
              <UButton color="error" :loading="isProcessing" @click="doDelete">
                删除
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- 清理确认对话框 -->
    <UModal v-model:open="cleanupModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold text-red-600">确认彻底清理</h3>
          </template>

          <p>确定要彻底清理照片「{{ photoToCleanup?.originalFilename }}」吗？</p>
          <p class="text-sm text-red-500 mt-2">
            此操作将删除数据库记录以及本地和 S3 存储中的文件，无法恢复！
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="cleanupModalOpen = false">
                取消
              </UButton>
              <UButton color="error" :loading="isProcessing" @click="doCleanup">
                彻底清理
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- 批量删除确认对话框 -->
    <UModal v-model:open="batchDeleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold">确认批量删除</h3>
          </template>

          <p>确定要删除选中的 <strong>{{ selectedIds.length }}</strong> 张照片吗？</p>
          <p class="text-sm text-gray-500 mt-2">
            照片将被标记为已删除，可在照片管理中彻底清理。
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="batchDeleteModalOpen = false">
                取消
              </UButton>
              <UButton color="error" :loading="isProcessing" @click="doBatchDelete">
                批量删除
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
  title: '照片管理 - 管理后台',
})

interface AdminPhoto {
  id: number
  albumId: number
  albumName: string | null
  originalFilename: string
  storedFilename: string
  thumbnailFilename: string
  thumbnailUrl: string
  originalUrl: string
  isSlideshow: number
  isDeleted: boolean
  deletedAt: string | null
  createdAt: string
}

interface PhotoListResponse {
  photos: AdminPhoto[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const toast = useToast()

// 分页状态
const currentPage = ref(1)
const showDeleted = ref(true)
const pageSize = ref(10)

const pageSizeOptions = [
  { label: '10 条/页', value: 10 },
  { label: '20 条/页', value: 20 },
  { label: '50 条/页', value: 50 },
  { label: '100 条/页', value: 100 },
]

// 选择状态
const selectedIds = ref<number[]>([])

// 本地照片列表（用于响应式更新）
const photos = ref<AdminPhoto[]>([])
const pagination = ref<{ page: number; limit: number; total: number; totalPages: number } | null>(null)

// 获取照片列表
const { data, status, refresh } = await useFetch<PhotoListResponse>('/api/admin/photos', {
  query: computed(() => ({
    page: currentPage.value,
    limit: pageSize.value,
    showDeleted: showDeleted.value,
  })),
  watch: [currentPage, showDeleted, pageSize],
})

// 同步 data 到本地 photos
watch(data, (newData) => {
  if (newData) {
    photos.value = [...newData.photos]
    pagination.value = { ...newData.pagination }
  }
}, { immediate: true })

// 监听分页变化时清空选择
watch([currentPage, pageSize, showDeleted], () => {
  selectedIds.value = []
})

// 计算属性
const isAllSelected = computed(() => {
  if (photos.value.length === 0) return false
  return photos.value.every(p => selectedIds.value.includes(p.id))
})

const isPartialSelected = computed(() => {
  if (photos.value.length === 0) return false
  const hasSelected = photos.value.some(p => selectedIds.value.includes(p.id))
  return hasSelected && !isAllSelected.value
})

// 选择操作
const toggleSelect = (id: number) => {
  const index = selectedIds.value.indexOf(id)
  if (index === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(index, 1)
  }
}

const toggleSelectAll = (checked: boolean | 'indeterminate') => {
  if (checked === true) {
    selectedIds.value = photos.value.map(p => p.id)
  } else {
    selectedIds.value = []
  }
}

const clearSelection = () => {
  selectedIds.value = []
}

// 对话框状态
const deleteModalOpen = ref(false)
const cleanupModalOpen = ref(false)
const batchDeleteModalOpen = ref(false)
const photoToDelete = ref<AdminPhoto | null>(null)
const photoToCleanup = ref<AdminPhoto | null>(null)
const isProcessing = ref(false)

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// 切换轮播状态
const toggleSlideshow = async (photo: AdminPhoto) => {
  const newValue = photo.isSlideshow ? 0 : 1
  try {
    await $fetch(`/api/admin/photos/${photo.id}`, {
      method: 'PUT',
      body: { isSlideshow: newValue },
    })
    // 直接更新本地数据
    const index = photos.value.findIndex(p => p.id === photo.id)
    if (index !== -1) {
      photos.value[index] = { ...photo, isSlideshow: newValue }
    }
    toast.add({
      title: newValue ? '已设置为轮播' : '已取消轮播',
      color: 'success',
    })
  } catch (error: any) {
    toast.add({
      title: '操作失败',
      description: error.data?.message || '请稍后重试',
      color: 'error',
    })
  }
}

// 批量设置轮播
const batchSetSlideshow = async (isSlideshow: boolean) => {
  if (selectedIds.value.length === 0) return

  const slideshowValue = isSlideshow ? 1 : 0
  const successIds: number[] = []

  try {
    // 逐个更新
    for (const id of selectedIds.value) {
      try {
        await $fetch(`/api/admin/photos/${id}`, {
          method: 'PUT',
          body: { isSlideshow },
        })
        successIds.push(id)
      } catch (e) {
        // 忽略单个失败
      }
    }

    // 更新本地数据
    photos.value = photos.value.map(photo => {
      if (successIds.includes(photo.id)) {
        return { ...photo, isSlideshow: slideshowValue }
      }
      return photo
    })

    toast.add({
      title: isSlideshow ? '批量设为轮播完成' : '批量取消轮播完成',
      description: `成功处理 ${successIds.length} 张照片`,
      color: 'success',
    })
    
    selectedIds.value = []
  } catch (error: any) {
    toast.add({
      title: '操作失败',
      description: error.data?.message || '请稍后重试',
      color: 'error',
    })
  }
}

// 确认删除
const confirmDelete = (photo: AdminPhoto) => {
  photoToDelete.value = photo
  deleteModalOpen.value = true
}

// 执行删除
const doDelete = async () => {
  if (!photoToDelete.value) return

  isProcessing.value = true
  const deleteId = photoToDelete.value.id
  
  try {
    await $fetch(`/api/photos/${deleteId}`, {
      method: 'DELETE',
    })

    // 更新本地数据
    const now = new Date().toISOString()
    photos.value = photos.value.map(photo => {
      if (photo.id === deleteId) {
        return { ...photo, isDeleted: true, deletedAt: now }
      }
      return photo
    })

    toast.add({
      title: '已删除',
      color: 'success',
    })

    deleteModalOpen.value = false
  } catch (error: any) {
    toast.add({
      title: '删除失败',
      description: error.data?.message || '请稍后重试',
      color: 'error',
    })
  } finally {
    isProcessing.value = false
  }
}

// 确认批量删除
const confirmBatchDelete = () => {
  batchDeleteModalOpen.value = true
}

// 执行批量删除
const doBatchDelete = async () => {
  if (selectedIds.value.length === 0) return

  isProcessing.value = true
  const successIds: number[] = []
  
  try {
    for (const id of selectedIds.value) {
      try {
        await $fetch(`/api/photos/${id}`, {
          method: 'DELETE',
        })
        successIds.push(id)
      } catch (e) {
        // 忽略单个失败
      }
    }

    // 更新本地数据
    const now = new Date().toISOString()
    photos.value = photos.value.map(photo => {
      if (successIds.includes(photo.id)) {
        return { ...photo, isDeleted: true, deletedAt: now }
      }
      return photo
    })

    toast.add({
      title: '批量删除完成',
      description: `成功删除 ${successIds.length} 张照片`,
      color: 'success',
    })

    batchDeleteModalOpen.value = false
    selectedIds.value = []
  } catch (error: any) {
    toast.add({
      title: '操作失败',
      description: error.data?.message || '请稍后重试',
      color: 'error',
    })
  } finally {
    isProcessing.value = false
  }
}

// 确认清理
const confirmCleanup = (photo: AdminPhoto) => {
  photoToCleanup.value = photo
  cleanupModalOpen.value = true
}

// 执行清理
const doCleanup = async () => {
  if (!photoToCleanup.value) return

  isProcessing.value = true
  const cleanupId = photoToCleanup.value.id
  
  try {
    const result = await $fetch<{ ok: boolean; message: string; errors?: string[] }>(
      `/api/admin/photos/${cleanupId}/cleanup`,
      { method: 'DELETE' }
    )

    // 直接从本地数据中移除
    const index = photos.value.findIndex(p => p.id === cleanupId)
    if (index !== -1) {
      photos.value.splice(index, 1)
      if (pagination.value) {
        pagination.value.total--
      }
    }

    if (result.errors && result.errors.length > 0) {
      toast.add({
        title: result.message,
        description: result.errors.join('; '),
        color: 'warning',
      })
    } else {
      toast.add({
        title: '已彻底清理',
        color: 'success',
      })
    }

    cleanupModalOpen.value = false
  } catch (error: any) {
    toast.add({
      title: '清理失败',
      description: error.data?.message || '请稍后重试',
      color: 'error',
    })
  } finally {
    isProcessing.value = false
  }
}
</script>
