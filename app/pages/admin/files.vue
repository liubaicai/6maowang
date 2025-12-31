<template>
  <div>
    <!-- 标签页切换 -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <h2 class="text-lg font-semibold">文件管理</h2>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          :color="activeTab === 'local' ? 'primary' : 'neutral'"
          :variant="activeTab === 'local' ? 'solid' : 'soft'"
          size="sm"
          @click="activeTab = 'local'"
        >
          <UIcon name="i-heroicons-folder" class="w-4 h-4 mr-1" />
          本地存储
        </UButton>
        <UButton
          :color="activeTab === 's3' ? 'primary' : 'neutral'"
          :variant="activeTab === 's3' ? 'solid' : 'soft'"
          size="sm"
          @click="activeTab = 's3'"
        >
          <UIcon name="i-heroicons-cloud" class="w-4 h-4 mr-1" />
          S3 存储
        </UButton>
      </div>
    </div>

    <!-- 本地文件管理 -->
    <div v-if="activeTab === 'local'">
      <!-- 面包屑导航 -->
      <div class="flex items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UButton
          size="xs"
          color="neutral"
          variant="soft"
          @click="localPath = ''"
          :disabled="!localPath"
        >
          <UIcon name="i-heroicons-home" class="w-4 h-4" />
        </UButton>
        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-400" />
        <span class="text-sm text-gray-600 dark:text-gray-400">data</span>
        <template v-for="(part, index) in localPathParts" :key="index">
          <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-400" />
          <button
            class="text-sm text-primary-600 hover:underline"
            @click="navigateToLocalPath(index)"
          >
            {{ part }}
          </button>
        </template>
      </div>

      <!-- 加载状态 -->
      <div v-if="localPending" class="flex justify-center py-16">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- 空状态 -->
      <div v-else-if="!localFiles?.files?.length" class="py-12 text-center text-gray-500">
        此目录为空
      </div>

      <!-- 文件列表 -->
      <div v-else class="space-y-2">
        <!-- 返回上级 -->
        <div
          v-if="localPath"
          class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          @click="navigateToParentLocal"
        >
          <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-up" class="w-6 h-6 text-gray-400" />
          </div>
          <div class="flex-1 min-w-0">
            <span class="font-medium text-gray-900 dark:text-white">..</span>
            <p class="text-sm text-gray-500">返回上级目录</p>
          </div>
        </div>

        <div
          v-for="file in localFiles.files"
          :key="file.path"
          class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :class="{ 'cursor-pointer': file.type === 'directory' }"
          @click="file.type === 'directory' ? (localPath = file.path) : null"
        >
          <!-- 图标 -->
          <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <UIcon
              :name="getFileIcon(file)"
              class="w-6 h-6"
              :class="file.type === 'directory' ? 'text-yellow-500' : 'text-gray-400'"
            />
          </div>

          <!-- 信息 -->
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 dark:text-white truncate">
              {{ file.name }}
            </h4>
            <p class="text-sm text-gray-500">
              <span v-if="file.type === 'file'">{{ formatBytes(file.size) }}</span>
              <span v-else>目录</span>
              <span class="mx-2">•</span>
              <span>{{ formatDate(file.mtime) }}</span>
            </p>
          </div>

          <!-- 操作 -->
          <div v-if="file.type === 'file' && isImageFile(file)" class="flex items-center gap-1">
            <UButton
              size="xs"
              color="neutral"
              variant="soft"
              @click.stop="previewLocalFile(file)"
            >
              预览
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- S3 文件管理 -->
    <div v-else-if="activeTab === 's3'">
      <!-- 面包屑导航 -->
      <div class="flex items-center gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <UButton
          size="xs"
          color="neutral"
          variant="soft"
          @click="s3Prefix = ''"
          :disabled="!s3Prefix"
        >
          <UIcon name="i-heroicons-home" class="w-4 h-4" />
        </UButton>
        <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-400" />
        <span class="text-sm text-gray-600 dark:text-gray-400">bucket</span>
        <template v-for="(part, index) in s3PrefixParts" :key="index">
          <UIcon name="i-heroicons-chevron-right" class="w-4 h-4 text-gray-400" />
          <button
            class="text-sm text-primary-600 hover:underline"
            @click="navigateToS3Prefix(index)"
          >
            {{ part }}
          </button>
        </template>
      </div>

      <!-- 加载状态 -->
      <div v-if="s3Pending" class="flex justify-center py-16">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- S3 未启用 -->
      <div v-else-if="s3Files && !s3Files.enabled" class="py-12 text-center">
        <UIcon name="i-heroicons-cloud" class="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p class="text-gray-500">S3 存储未启用</p>
        <UButton to="/admin/storage" color="primary" variant="soft" class="mt-4">
          前往配置
        </UButton>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!s3Files?.folders?.length && !s3Files?.files?.length" class="py-12 text-center text-gray-500">
        此目录为空
      </div>

      <!-- 文件列表 -->
      <div v-else class="space-y-2">
        <!-- 返回上级 -->
        <div
          v-if="s3Prefix"
          class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          @click="navigateToParentS3"
        >
          <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <UIcon name="i-heroicons-arrow-up" class="w-6 h-6 text-gray-400" />
          </div>
          <div class="flex-1 min-w-0">
            <span class="font-medium text-gray-900 dark:text-white">..</span>
            <p class="text-sm text-gray-500">返回上级目录</p>
          </div>
        </div>

        <!-- 文件夹 -->
        <div
          v-for="folder in s3Files?.folders"
          :key="folder.path"
          class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          @click="s3Prefix = folder.path"
        >
          <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <UIcon name="i-heroicons-folder" class="w-6 h-6 text-yellow-500" />
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 dark:text-white truncate">
              {{ folder.name }}
            </h4>
            <p class="text-sm text-gray-500">目录</p>
          </div>
        </div>

        <!-- 文件 -->
        <div
          v-for="file in s3Files?.files"
          :key="file.key"
          class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <div class="w-10 h-10 flex-shrink-0 flex items-center justify-center">
            <UIcon
              :name="getS3FileIcon(file)"
              class="w-6 h-6 text-gray-400"
            />
          </div>
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-gray-900 dark:text-white truncate">
              {{ file.name }}
            </h4>
            <p class="text-sm text-gray-500">
              {{ file.sizeFormatted }}
              <span v-if="file.lastModified" class="mx-2">•</span>
              <span v-if="file.lastModified">{{ formatDate(file.lastModified) }}</span>
            </p>
          </div>
        </div>

        <!-- 加载更多 -->
        <div v-if="s3Files?.hasMore" class="flex justify-center py-4">
          <UButton
            color="neutral"
            variant="soft"
            :loading="s3LoadingMore"
            @click="loadMoreS3Files"
          >
            加载更多
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useSeoMeta({
  title: '文件管理 - 管理后台',
})

// 标签页状态
const activeTab = ref<'local' | 's3'>('local')

// 本地文件相关
const localPath = ref('')

const localPathParts = computed(() => {
  if (!localPath.value) return []
  return localPath.value.split('/').filter(Boolean)
})

const { data: localFiles, pending: localPending, refresh: refreshLocal } = await useFetch('/api/admin/files/local', {
  query: computed(() => ({
    path: localPath.value,
  })),
  watch: [localPath],
})

const navigateToLocalPath = (index: number) => {
  const parts = localPathParts.value.slice(0, index + 1)
  localPath.value = parts.join('/')
}

const navigateToParentLocal = () => {
  if (localFiles.value?.parentPath !== null) {
    localPath.value = localFiles.value?.parentPath || ''
  }
}

const previewLocalFile = (file: any) => {
  // 构建预览 URL
  let url = ''
  if (file.path.startsWith('uploads/originals/')) {
    url = `/api/uploads/originals/${file.name}`
  } else if (file.path.startsWith('uploads/thumbs/')) {
    url = `/api/uploads/thumbs/${file.name}`
  }
  if (url) {
    window.open(url, '_blank')
  }
}

// S3 文件相关
const s3Prefix = ref('')
const s3LoadingMore = ref(false)

const s3PrefixParts = computed(() => {
  if (!s3Prefix.value) return []
  return s3Prefix.value.split('/').filter(Boolean)
})

const { data: s3Files, pending: s3Pending, refresh: refreshS3 } = await useFetch('/api/admin/files/s3', {
  query: computed(() => ({
    prefix: s3Prefix.value,
  })),
  watch: [s3Prefix],
})

const navigateToS3Prefix = (index: number) => {
  const parts = s3PrefixParts.value.slice(0, index + 1)
  s3Prefix.value = parts.join('/') + '/'
}

const navigateToParentS3 = () => {
  if (s3Files.value?.parentPrefix !== null) {
    s3Prefix.value = s3Files.value?.parentPrefix || ''
  }
}

const loadMoreS3Files = async () => {
  if (!s3Files.value?.nextToken) return
  s3LoadingMore.value = true
  try {
    const moreFiles = await $fetch('/api/admin/files/s3', {
      query: {
        prefix: s3Prefix.value,
        token: s3Files.value.nextToken,
      },
    })
    // 合并文件
    if (s3Files.value) {
      s3Files.value.files.push(...(moreFiles.files || []))
      s3Files.value.folders.push(...(moreFiles.folders || []))
      s3Files.value.hasMore = moreFiles.hasMore
      s3Files.value.nextToken = moreFiles.nextToken
    }
  } finally {
    s3LoadingMore.value = false
  }
}

// 工具函数
const getFileIcon = (file: any) => {
  if (file.type === 'directory') return 'i-heroicons-folder'
  const ext = file.extension
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'i-heroicons-photo'
  if (['.mp4', '.mov', '.avi'].includes(ext)) return 'i-heroicons-film'
  if (['.mp3', '.wav', '.ogg'].includes(ext)) return 'i-heroicons-musical-note'
  if (['.pdf'].includes(ext)) return 'i-heroicons-document'
  return 'i-heroicons-document'
}

const getS3FileIcon = (file: any) => {
  const ext = file.extension
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'i-heroicons-photo'
  if (['mp4', 'mov', 'avi'].includes(ext)) return 'i-heroicons-film'
  if (['mp3', 'wav', 'ogg'].includes(ext)) return 'i-heroicons-musical-note'
  if (['pdf'].includes(ext)) return 'i-heroicons-document'
  return 'i-heroicons-document'
}

const isImageFile = (file: any) => {
  const ext = file.extension
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>
