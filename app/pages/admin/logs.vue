<template>
  <div>
    <div class="mb-6">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-semibold">操作日志</h2>
        <span v-if="logs" class="text-sm text-gray-500">
          共 {{ logs.total }} 条
        </span>
      </div>
      <p class="text-sm text-gray-500 mt-1">查看系统用户的操作记录</p>
    </div>
    
    <div v-if="pending" class="flex justify-center py-12">
      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-gray-400" />
    </div>
    
    <div v-else-if="logs && logs.logs && logs.logs.length > 0">
      <!-- 日志列表（网格布局，与其他页面一致） -->
      <div class="space-y-3">
        <div
          v-for="log in logs.logs"
          :key="log.id"
          class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <!-- 用户头像占位 -->
          <div class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
            <UIcon name="i-heroicons-user" class="w-5 h-5 text-gray-400" />
          </div>
          
          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-medium text-gray-900 dark:text-white">{{ log.displayName }}</span>
              <span class="text-sm text-gray-500">@{{ log.username }}</span>
              <UBadge :color="getActionColor(log.action)" variant="soft" size="xs">
                {{ getActionLabel(log.action) }}
              </UBadge>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span v-if="log.details">
                <template v-if="log.action === 'create_album' || log.action === 'delete_album'">
                  相册: {{ log.details.albumName }}
                </template>
                <template v-else-if="log.action === 'upload_photos'">
                  上传 {{ log.details.photoCount }} 张照片到 {{ log.details.albumName }}
                </template>
                <template v-else-if="log.action === 'delete_photo'">
                  文件: {{ log.details.filename }}
                </template>
                <template v-else-if="log.action === 'create_user' || log.action === 'update_user'">
                  用户: {{ log.details.username }}
                </template>
                <template v-else>
                  {{ log.resourceType }} #{{ log.resourceId }}
                </template>
              </span>
              <span v-else>{{ log.resourceType }} #{{ log.resourceId }}</span>
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {{ formatDate(log.createdAt) }}
            </p>
          </div>
        </div>
      </div>
      
      <!-- 分页（与其他页面一致） -->
      <div v-if="logs.totalPages > 1" class="mt-6 flex justify-center">
        <UPagination
          v-model:page="currentPage"
          :total="logs.total"
          :items-per-page="50"
          @update:page="loadPage"
        />
      </div>
    </div>
    
    <div v-else class="py-12 text-center text-gray-500">
      暂无操作日志
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useSeoMeta({
  title: '操作日志 - 管理后台',
})

const currentPage = ref(1)

// 获取日志列表
const { data: logs, pending, refresh } = await useFetch('/api/admin/logs', {
  query: computed(() => ({
    page: currentPage.value,
    pageSize: 50,
  })),
  watch: [currentPage],
})

// 加载指定页
const loadPage = async (page: number) => {
  currentPage.value = page
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN')
}

// 获取操作类型标签
const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    'create_album': '创建相册',
    'delete_album': '删除相册',
    'upload_photos': '上传照片',
    'delete_photo': '删除照片',
    'create_user': '创建用户',
    'update_user': '更新用户',
  }
  return labels[action] || action
}

// 获取操作类型颜色
const getActionColor = (action: string) => {
  if (action.startsWith('create')) return 'success'
  if (action.startsWith('delete')) return 'error'
  if (action.startsWith('update') || action.startsWith('upload')) return 'primary'
  return 'neutral'
}
</script>
