<template>
  <div>
    <!-- 操作栏 -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-lg font-semibold">所有相册</h2>
      <div class="flex items-center gap-4">
        <!-- 每页条数 -->
        <USelect v-model="pageSize" :items="pageSizeOptions" class="w-32" />
        <UButton to="/admin/albums/new" color="primary">
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
    <div v-else class="space-y-2">
      <div
        v-for="album in albums"
        :key="album.id"
        class="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:shadow-sm transition-shadow"
      >
          <!-- 封面 -->
          <div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            <img
              v-if="album.coverThumb"
              :src="`/api/uploads/thumbs/${album.coverThumb}`"
              :alt="album.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-photo" class="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-medium text-sm text-gray-900 dark:text-white">{{ album.name }}</h3>
              <UBadge color="neutral" variant="soft" size="xs">
                {{ album.photoCount }} 张照片
              </UBadge>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ album.description || '暂无描述' }}
            </p>
          </div>
          
          <!-- 操作 -->
          <div class="flex items-center gap-1">
            <UButton
              :to="`/admin/albums/${album.id}/photos`"
              color="primary"
              variant="soft"
              size="xs"
            >
              管理照片
            </UButton>
            <UButton
              :to="`/admin/albums/${album.id}/edit`"
              color="neutral"
              variant="soft"
              size="xs"
            >
              编辑
            </UButton>
            <UButton
              v-if="isAdmin"
              color="error"
              variant="soft"
              size="xs"
              @click="confirmDelete(album)"
            >
              删除
            </UButton>
          </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div v-if="pagination && pagination.totalPages > 1" class="flex items-center justify-between mt-6">
      <div class="text-sm text-gray-500">
        共 {{ pagination.total }} 个相册，第 {{ pagination.page }}/{{ pagination.totalPages }} 页
      </div>
      <UPagination
        v-model:page="currentPage"
        :total="pagination.total"
        :items-per-page="pageSize"
      />
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
      description: err.data?.message || err.message,
      color: 'error' 
    })
  } finally {
    deleting.value = false
  }
}
</script>
