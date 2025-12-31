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
        <USelectMenu
          v-model="filterAlbumId"
          :items="albumFilterOptions"
          value-key="value"
          placeholder="所有相册"
          class="w-80"
        />
        <USelectMenu
          v-model="filterSlideshow"
          :items="slideshowFilterOptions"
          value-key="value"
          placeholder="轮播状态"
          class="w-32"
        />
        <USelectMenu
          v-model="filterDeleted"
          :items="deletedFilterOptions"
          value-key="value"
          placeholder="删除状态"
          class="w-32"
        />
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
      class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between"
      :class="{ 'bg-primary-50 dark:bg-primary-950': selectedIds.length > 0 }"
    >
      <span class="text-sm text-gray-500">
        <template v-if="selectedIds.length > 0">
          已选择 <strong class="text-gray-900 dark:text-white">{{ selectedIds.length }}</strong> 张照片
        </template>
        <template v-else>
          请勾选照片进行批量操作
        </template>
      </span>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-heroicons-play"
          size="sm"
          color="success"
          variant="soft"
          :disabled="selectedIds.length === 0"
          @click="batchSetSlideshow(true)"
        >
          设为轮播
        </UButton>
        <UButton
          icon="i-heroicons-pause"
          size="sm"
          color="warning"
          variant="soft"
          :disabled="selectedIds.length === 0"
          @click="batchSetSlideshow(false)"
        >
          取消轮播
        </UButton>
        <UButton
          icon="i-heroicons-folder-arrow-down"
          size="sm"
          color="primary"
          variant="soft"
          :disabled="selectedIds.length === 0"
          @click="confirmBatchMove"
        >
          移动到相册
        </UButton>
        <UButton
          icon="i-heroicons-trash"
          size="sm"
          color="error"
          variant="soft"
          :disabled="selectedIds.length === 0"
          @click="confirmBatchDelete"
        >
          批量删除
        </UButton>
        <UButton
          size="sm"
          color="neutral"
          variant="ghost"
          :disabled="selectedIds.length === 0"
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
    <div v-else>
      <!-- 全选 -->
      <div class="flex items-center gap-2 px-3 py-2 mb-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UCheckbox
          :model-value="isAllSelected"
          :indeterminate="isPartialSelected"
          @update:model-value="(val: any) => toggleSelectAll(val)"
        />
        <span class="text-sm text-gray-500">全选当前页</span>
      </div>

      <!-- 网格布局 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- 照片列表项 -->
        <div
          v-for="photo in photos"
          :key="photo.id"
          class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :class="{ 'opacity-60 ring-2 ring-red-300 dark:ring-red-700': photo.isDeleted }"
        >
          <!-- 选择框 -->
          <UCheckbox
            :model-value="selectedIds.includes(photo.id)"
            @update:model-value="toggleSelect(photo.id)"
            class="flex-shrink-0"
          />

          <!-- 缩略图 -->
          <div 
            class="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0 cursor-pointer"
            @click="viewPhoto(photo)"
          >
            <img
              :src="photo.thumbnailUrl"
              :alt="photo.originalFilename"
              class="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          
          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-medium text-gray-900 dark:text-white truncate">
                {{ photo.originalFilename }}
              </h4>
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
            </p>
            <p class="text-sm text-gray-400 dark:text-gray-500">
              {{ formatDate(photo.createdAt) }}
            </p>
            <!-- 操作 -->
            <div class="flex items-center gap-1 mt-2 flex-wrap">
              <template v-if="!photo.isDeleted">
                <UButton
                  v-if="photo.isSlideshow"
                  size="xs"
                  color="warning"
                  variant="soft"
                  @click="toggleSlideshow(photo)"
                >
                  取消轮播
                </UButton>
                <UButton
                  v-else
                  size="xs"
                  color="success"
                  variant="soft"
                  @click="toggleSlideshow(photo)"
                >
                  设为轮播
                </UButton>
                <UButton
                  size="xs"
                  color="primary"
                  variant="soft"
                  @click="confirmMove(photo)"
                >
                  移动
                </UButton>
                <UButton
                  size="xs"
                  color="error"
                  variant="soft"
                  @click="confirmDelete(photo)"
                >
                  删除
                </UButton>
              </template>
              <template v-else>
                <UButton
                  size="xs"
                  color="error"
                  variant="solid"
                  @click="confirmCleanup(photo)"
                >
                  清理
                </UButton>
              </template>
            </div>
          </div>
        </div>
      </div>

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

    <!-- 移动照片对话框 -->
    <UModal v-model:open="moveModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold">移动照片到相册</h3>
          </template>

          <div class="space-y-3">
            <p v-if="photoToMove">
              将照片「{{ photoToMove.originalFilename }}」移动到：
            </p>
            <p v-else>
              将选中的 <strong>{{ selectedIds.length }}</strong> 张照片移动到：
            </p>

            <USelectMenu
              v-model="selectedAlbumId"
              :items="albumOptions"
              value-key="value"
              placeholder="选择目标相册"
              :loading="albumsLoading"
              class="w-full"
            />
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="moveModalOpen = false">
                取消
              </UButton>
              <UButton 
                color="primary" 
                :loading="isProcessing" 
                :disabled="!selectedAlbumId"
                @click="doMove"
              >
                确认移动
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

interface Album {
  id: number
  name: string
  description: string | null
  coverPhotoId: number | null
  coverThumb: string | null
  photoCount: number
  createdAt: string
  updatedAt: string
}

const toast = useToast()

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)
const filterAlbumId = ref<number | undefined>(undefined)
const filterSlideshow = ref<boolean | undefined>(undefined)
const filterDeleted = ref<boolean | undefined>(undefined)

const pageSizeOptions = [
  { label: '10 条/页', value: 10 },
  { label: '20 条/页', value: 20 },
  { label: '50 条/页', value: 50 },
  { label: '100 条/页', value: 100 },
]

const slideshowFilterOptions = [
  { label: '全部', value: undefined },
  { label: '轮播中', value: true },
  { label: '未轮播', value: false },
]

const deletedFilterOptions = [
  { label: '全部', value: undefined },
  { label: '已删除', value: true },
  { label: '未删除', value: false },
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
    isDeleted: filterDeleted.value,
    albumId: filterAlbumId.value,
    isSlideshow: filterSlideshow.value,
  })),
  watch: [currentPage, pageSize, filterDeleted, filterAlbumId, filterSlideshow],
})

// 同步 data 到本地 photos
watch(data, (newData) => {
  if (newData) {
    photos.value = [...newData.photos]
    pagination.value = { ...newData.pagination }
  }
}, { immediate: true })

// 监听分页变化时清空选择
watch([currentPage, pageSize, filterDeleted, filterAlbumId, filterSlideshow], () => {
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
const moveModalOpen = ref(false)
const photoToDelete = ref<AdminPhoto | null>(null)
const photoToCleanup = ref<AdminPhoto | null>(null)
const photoToMove = ref<AdminPhoto | null>(null)
const isProcessing = ref(false)

// 相册列表
const albums = ref<Album[]>([])
const albumsLoading = ref(false)
const selectedAlbumId = ref<number | undefined>(undefined)

// 相册筛选选项（包含“所有相册”选项）
const albumFilterOptions = computed(() => [
  { label: '所有相册', value: undefined },
  ...albums.value.map(album => ({
    label: `${album.name} (${album.photoCount})`,
    value: album.id
  }))
])

// 计算选中的相册名称
const selectedAlbumName = computed(() => {
  if (!selectedAlbumId.value) return ''
  const album = albums.value.find(a => a.id === selectedAlbumId.value)
  return album?.name || ''
})

// 将相册列表转换为 USelectMenu 需要的格式
const albumOptions = computed(() => {
  return albums.value.map(album => ({
    label: `${album.name} (${album.photoCount})`,
    value: album.id
  }))
})

// 获取相册列表
const fetchAlbums = async () => {
  albumsLoading.value = true
  try {
    const response = await $fetch<{ albums: Album[] }>('/api/albums', {
      query: { limit: 100 }
    })
    albums.value = response.albums
  } catch (error: any) {
    toast.add({
      title: '获取相册列表失败',
      description: error.data?.message || '请稍后重试',
      color: 'error',
    })
  } finally {
    albumsLoading.value = false
  }
}

// 页面加载时获取相册列表用于筛选
fetchAlbums()

// 查看原图
const viewPhoto = (photo: AdminPhoto) => {
  const url = photo.originalUrl || `/api/uploads/originals/${photo.storedFilename}`
  window.open(url, '_blank')
}

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

// 确认移动单张照片
const confirmMove = async (photo: AdminPhoto) => {
  photoToMove.value = photo
  selectedAlbumId.value = undefined
  await fetchAlbums()
  moveModalOpen.value = true
}

// 确认批量移动
const confirmBatchMove = async () => {
  if (selectedIds.value.length === 0) return
  photoToMove.value = null
  selectedAlbumId.value = undefined
  await fetchAlbums()
  moveModalOpen.value = true
}

// 执行移动
const doMove = async () => {
  if (!selectedAlbumId.value) return

  isProcessing.value = true
  
  try {
    // 单张照片移动
    if (photoToMove.value) {
      await $fetch(`/api/photos/${photoToMove.value.id}`, {
        method: 'PUT',
        body: { albumId: selectedAlbumId.value },
      })

      // 更新本地数据
      const targetAlbum = albums.value.find(a => a.id === selectedAlbumId.value)
      photos.value = photos.value.map(photo => {
        if (photo.id === photoToMove.value!.id) {
          return { 
            ...photo, 
            albumId: selectedAlbumId.value!, 
            albumName: targetAlbum?.name || null 
          }
        }
        return photo
      })

      toast.add({
        title: '移动成功',
        color: 'success',
      })
    }
    // 批量移动
    else {
      const successIds: number[] = []
      for (const id of selectedIds.value) {
        try {
          await $fetch(`/api/photos/${id}`, {
            method: 'PUT',
            body: { albumId: selectedAlbumId.value },
          })
          successIds.push(id)
        } catch (e) {
          // 忽略单个失败
        }
      }

      // 更新本地数据
      const targetAlbum = albums.value.find(a => a.id === selectedAlbumId.value)
      photos.value = photos.value.map(photo => {
        if (successIds.includes(photo.id)) {
          return { 
            ...photo, 
            albumId: selectedAlbumId.value!, 
            albumName: targetAlbum?.name || null 
          }
        }
        return photo
      })

      toast.add({
        title: '批量移动完成',
        description: `成功移动 ${successIds.length} 张照片`,
        color: 'success',
      })

      selectedIds.value = []
    }

    moveModalOpen.value = false
  } catch (error: any) {
    toast.add({
      title: '移动失败',
      description: error.data?.message || '请稍后重试',
      color: 'error',
    })
  } finally {
    isProcessing.value = false
  }
}
</script>
