<template>
  <div>
    <!-- 操作栏 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-semibold">所有相册</h2>
        <span v-if="pagination" class="text-sm text-gray-500">
          共 {{ pagination.total }} 个
        </span>
      </div>
      <div class="flex items-center gap-3">
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
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <UCheckbox
            :model-value="isAllSelected"
            :indeterminate="isPartialSelected"
            @update:model-value="(val: any) => toggleSelectAll(val)"
          />
          <span class="text-sm text-gray-500">全选当前页</span>
        </div>
        <span class="text-sm text-gray-500">
          <template v-if="selectedIds.length > 0">
            已选择 <strong class="text-gray-900 dark:text-white">{{ selectedIds.length }}</strong> 个相册
          </template>
        </span>
      </div>
      <div class="flex items-center gap-2">
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
        <UButton to="/admin/albums/new" size="sm" color="primary">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
          新建相册
        </UButton>
      </div>
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
    <div v-else>
      <!-- 网格布局 -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="album in albums"
          :key="album.id"
          class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <!-- 选择框 -->
          <UCheckbox
            :model-value="selectedIds.includes(album.id)"
            @update:model-value="toggleSelect(album.id)"
            class="flex-shrink-0"
          />

          <!-- 封面 -->
          <div class="w-24 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
            <img
              v-if="album.coverThumb"
              :src="`/api/uploads/thumbs/${album.coverThumb}`"
              :alt="album.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-photo" class="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-medium text-gray-900 dark:text-white truncate">
                {{ album.name }}
              </h4>
              <UBadge color="neutral" variant="soft" size="xs">
                {{ album.photoCount }} 张
              </UBadge>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {{ album.description || '暂无描述' }}
            </p>
            <p class="text-sm text-gray-400 dark:text-gray-500">
              {{ formatDate(album.createdAt) }}
            </p>
            <!-- 操作 -->
            <div class="flex items-center gap-1 mt-2 flex-wrap">
              <UButton
                :to="`/admin/albums/${album.id}/photos`"
                size="xs"
                color="primary"
                variant="soft"
              >
                管理照片
              </UButton>
              <UButton
                :to="`/admin/albums/${album.id}/edit`"
                size="xs"
                color="neutral"
                variant="soft"
              >
                编辑
              </UButton>
              <UButton
                v-if="isAdmin"
                size="xs"
                color="error"
                variant="soft"
                @click="confirmDelete(album)"
              >
                删除
              </UButton>
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

    <!-- 批量删除确认对话框 -->
    <UModal v-model:open="batchDeleteModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold">确认批量删除</h3>
          </template>

          <p>确定要删除选中的 <strong>{{ selectedIds.length }}</strong> 个相册吗？</p>
          <p class="text-sm text-gray-500 mt-2">
            此操作将同时删除所有选中相册内的照片，且不可恢复。
          </p>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton color="neutral" variant="ghost" @click="batchDeleteModalOpen = false">
                取消
              </UButton>
              <UButton color="error" :loading="deleting" @click="handleBatchDelete">
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

interface AlbumListResponse {
  albums: Album[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useSeoMeta({
  title: '相册管理 - 管理后台',
})

const toast = useToast()

// 分页状态
const currentPage = ref(1)
const pageSize = ref(10)

const pageSizeOptions = [
  { label: '10 条/页', value: 10 },
  { label: '20 条/页', value: 20 },
  { label: '50 条/页', value: 50 },
]

// 获取当前用户信息
const { data: session } = await useFetch('/api/auth/session')
const isAdmin = computed(() => session.value?.user?.role === 'admin')

// 本地数据（用于响应式更新）
const albums = ref<Album[]>([])
const pagination = ref<AlbumListResponse['pagination'] | null>(null)

// 获取相册列表
const { data, status, refresh } = await useFetch<AlbumListResponse>('/api/albums', {
  query: computed(() => ({
    page: currentPage.value,
    limit: pageSize.value,
  })),
  watch: [currentPage, pageSize],
})

// 同步数据到本地
watch(data, (newData) => {
  if (newData) {
    albums.value = newData.albums
    pagination.value = newData.pagination
  }
}, { immediate: true })

// 切换每页数量时重置到第一页
watch(pageSize, () => {
  currentPage.value = 1
})

// 监听分页变化时清空选择
watch([currentPage, pageSize], () => {
  selectedIds.value = []
})

// 选择状态
const selectedIds = ref<number[]>([])

// 计算属性
const isAllSelected = computed(() => {
  if (albums.value.length === 0) return false
  return albums.value.every(a => selectedIds.value.includes(a.id))
})

const isPartialSelected = computed(() => {
  if (albums.value.length === 0) return false
  const hasSelected = albums.value.some(a => selectedIds.value.includes(a.id))
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
    selectedIds.value = albums.value.map(a => a.id)
  } else {
    selectedIds.value = []
  }
}

const clearSelection = () => {
  selectedIds.value = []
}

// 格式化日期
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

// 删除相关
const deleteModalOpen = ref(false)
const batchDeleteModalOpen = ref(false)
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
      description: err.data?.message || err.message,
      color: 'error' 
    })
  } finally {
    deleting.value = false
  }
}

// 确认批量删除
const confirmBatchDelete = () => {
  batchDeleteModalOpen.value = true
}

// 执行批量删除
const handleBatchDelete = async () => {
  if (selectedIds.value.length === 0) return

  deleting.value = true
  const successIds: number[] = []
  
  try {
    for (const id of selectedIds.value) {
      try {
        await $fetch(`/api/albums/${id}`, {
          method: 'DELETE',
        })
        successIds.push(id)
      } catch (e) {
        // 忽略单个失败
      }
    }

    toast.add({
      title: '批量删除完成',
      description: `成功删除 ${successIds.length} 个相册`,
      color: 'success',
    })

    batchDeleteModalOpen.value = false
    selectedIds.value = []
    await refresh()
  } catch (error: any) {
    toast.add({
      title: '操作失败',
      description: error.data?.message || '请稍后重试',
      color: 'error',
    })
  } finally {
    deleting.value = false
  }
}
</script>
