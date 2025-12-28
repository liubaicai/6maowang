<template>
  <div>
    <div class="mb-6">
      <h2 class="text-lg font-semibold">操作日志</h2>
      <p class="text-sm text-gray-500 mt-1">查看系统用户的操作记录</p>
    </div>
    
    <UCard>
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-gray-400" />
      </div>
      
      <div v-else-if="logs && logs.logs && logs.logs.length > 0">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="text-left py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">时间</th>
                <th class="text-left py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">用户</th>
                <th class="text-left py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">操作</th>
                <th class="text-left py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">详情</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="log in logs.logs"
                :key="log.id"
                class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <td class="py-3 px-4">
                  <div class="text-sm text-gray-500">{{ formatDate(log.createdAt) }}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-medium">{{ log.displayName }}</div>
                  <div class="text-xs text-gray-500">@{{ log.username }}</div>
                </td>
                <td class="py-3 px-4">
                  <UBadge :color="getActionColor(log.action)" variant="soft">
                    {{ getActionLabel(log.action) }}
                  </UBadge>
                </td>
                <td class="py-3 px-4">
                  <div class="text-sm text-gray-600 dark:text-gray-400">
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
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 分页 -->
        <div v-if="logs.totalPages > 1" class="mt-4 flex justify-center">
          <div class="flex gap-2">
            <UButton
              icon="i-heroicons-chevron-left"
              color="neutral"
              variant="soft"
              size="sm"
              :disabled="currentPage <= 1"
              @click="loadPage(currentPage - 1)"
            />
            <div class="flex items-center px-3 text-sm text-gray-600 dark:text-gray-400">
              第 {{ currentPage }} / {{ logs.totalPages }} 页
            </div>
            <UButton
              icon="i-heroicons-chevron-right"
              color="neutral"
              variant="soft"
              size="sm"
              :disabled="currentPage >= logs.totalPages"
              @click="loadPage(currentPage + 1)"
            />
          </div>
        </div>
      </div>
      
      <div v-else class="py-12 text-center text-gray-500">
        暂无操作日志
      </div>
    </UCard>
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
  query: {
    page: currentPage,
    pageSize: 50,
  },
})

// 加载指定页
const loadPage = async (page: number) => {
  currentPage.value = page
  await refresh()
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
  if (action.startsWith('create')) return 'green'
  if (action.startsWith('delete')) return 'red'
  if (action.startsWith('update') || action.startsWith('upload')) return 'blue'
  return 'neutral'
}
</script>
