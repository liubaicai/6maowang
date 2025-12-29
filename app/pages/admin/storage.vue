<template>
  <div class="max-w-4xl space-y-6">
    <!-- S3 配置表单 -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-cloud" class="w-5 h-5 text-primary-500" />
          <h3 class="font-semibold">S3 对象存储配置</h3>
        </div>
      </template>
      
      <form @submit.prevent="handleSaveConfig" class="space-y-6">
        <!-- 启用开关 -->
        <div class="flex items-center gap-3">
          <USwitch v-model="form.enabled" />
          <span class="text-sm font-medium">启用 S3 存储</span>
        </div>
        
        <div v-if="form.enabled" class="space-y-4">
          <!-- 存储提供商选择 -->
          <div>
            <label class="block text-sm font-medium mb-1">
              存储提供商 <span class="text-red-500">*</span>
            </label>
            <USelect
              v-model="form.provider"
              :options="[
                { label: '标准 S3（AWS S3、MinIO 等）', value: 'standard-s3' },
                { label: '阿里云 OSS', value: 'aliyun-oss' }
              ]"
              option-attribute="label"
              value-attribute="value"
              class="w-full"
            />
            <p class="text-xs text-gray-500 mt-1">选择您使用的对象存储提供商</p>
          </div>
          
          <!-- 端点 -->
          <div>
            <label class="block text-sm font-medium mb-1">
              Endpoint <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.endpoint"
              :placeholder="form.provider === 'aliyun-oss' ? 'https://oss-cn-hangzhou.aliyuncs.com' : 'https://s3.amazonaws.com 或 https://your-minio.com'"
              class="w-full"
            />
            <p class="text-xs text-gray-500 mt-1">
              <span v-if="form.provider === 'aliyun-oss'">阿里云 OSS Endpoint，例如: https://oss-cn-hangzhou.aliyuncs.com</span>
              <span v-else>S3 API 端点地址，支持 AWS S3、MinIO 等</span>
            </p>
          </div>
          
          <!-- Region -->
          <div>
            <label class="block text-sm font-medium mb-1">Region</label>
            <UInput
              v-model="form.region"
              :placeholder="form.provider === 'aliyun-oss' ? 'oss-cn-hangzhou' : 'us-east-1'"
              class="w-full"
            />
            <p class="text-xs text-gray-500 mt-1">
              <span v-if="form.provider === 'aliyun-oss'">存储区域，例如: oss-cn-hangzhou, oss-cn-beijing</span>
              <span v-else>存储区域，默认 us-east-1</span>
            </p>
          </div>
          
          <!-- Bucket -->
          <div>
            <label class="block text-sm font-medium mb-1">
              Bucket <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.bucket"
              placeholder="my-photo-bucket"
              class="w-full"
            />
          </div>
          
          <!-- Access Key ID -->
          <div>
            <label class="block text-sm font-medium mb-1">
              Access Key ID <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.accessKeyId"
              placeholder="AKIAXXXXXXXXXXXXXXXX"
              class="w-full"
            />
          </div>
          
          <!-- Secret Access Key -->
          <div>
            <label class="block text-sm font-medium mb-1">
              Secret Access Key <span class="text-red-500">*</span>
            </label>
            <UInput
              v-model="form.secretAccessKey"
              type="password"
              placeholder="输入 Secret Access Key"
              class="w-full"
            />
            <p v-if="form.secretAccessKey === '********'" class="text-xs text-gray-500 mt-1">
              已配置密钥，留空表示保持不变
            </p>
          </div>
          
          <!-- 使用签名 URL -->
          <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <USwitch v-model="form.useSignedUrl" class="mt-0.5" />
            <div class="flex-1">
              <span class="text-sm font-medium">使用签名 URL（私有存储桶）</span>
              <p class="text-xs text-gray-500 mt-1">
                启用后，将为私有存储桶生成临时访问 URL。如果您的存储桶设置为私有（不允许公开访问），请启用此选项。
              </p>
            </div>
          </div>
          
          <!-- URL 过期时间 -->
          <div v-if="form.useSignedUrl">
            <label class="block text-sm font-medium mb-1">
              签名 URL 过期时间（秒）
            </label>
            <UInput
              v-model.number="form.urlExpirationSeconds"
              type="number"
              min="30"
              max="604800"
              placeholder="3600"
              class="w-full"
            />
            <p class="text-xs text-gray-500 mt-1">
              签名 URL 的有效时长，建议设置 3600（1小时）到 86400（24小时）之间
            </p>
          </div>
          
          <!-- Public URL -->
          <div>
            <label class="block text-sm font-medium mb-1">
              公开访问 URL {{ form.useSignedUrl ? '' : '(必填)' }}
            </label>
            <UInput
              v-model="form.publicUrl"
              placeholder="https://cdn.example.com 或 https://bucket.s3.region.amazonaws.com"
              class="w-full"
            />
            <p class="text-xs text-gray-500 mt-1">
              <span v-if="form.useSignedUrl">（可选）使用签名 URL 时，此字段可以留空</span>
              <span v-else>用于生成图片访问链接的 URL 前缀（可以是 CDN 地址）</span>
            </p>
          </div>
        </div>
        
        <div class="flex gap-3">
          <UButton
            type="submit"
            color="primary"
            :loading="saving"
          >
            保存配置
          </UButton>
          
          <UButton
            v-if="form.enabled"
            type="button"
            color="neutral"
            variant="soft"
            :loading="testing"
            @click="handleTestConnection"
          >
            测试连接
          </UButton>
        </div>
      </form>
    </UCard>
    
    <!-- S3 存储统计 -->
    <UCard v-if="config?.enabled">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-chart-pie" class="w-5 h-5 text-blue-500" />
          <h3 class="font-semibold">S3 存储统计</h3>
        </div>
      </template>
      
      <div v-if="statsLoading" class="flex items-center justify-center py-8 text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin mr-2" />
        加载中...
      </div>
      
      <div v-else class="grid grid-cols-2 gap-6">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">存储占用</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ s3Stats?.totalSizeFormatted || '0 B' }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">对象数量</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ s3Stats?.objectCount || 0 }}
          </p>
        </div>
      </div>
    </UCard>
    
    <!-- 同步本地照片到 S3 -->
    <UCard v-if="config?.enabled">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-cloud-arrow-up" class="w-5 h-5 text-green-500" />
          <h3 class="font-semibold">同步照片到 S3</h3>
        </div>
      </template>
      
      <div class="space-y-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
          检查所有本地照片并同步到 S3 存储。会自动检测 S3 上是否已存在文件，避免重复上传。
        </p>
        
        <!-- 同步进度 -->
        <div v-if="syncing && syncProgress" class="space-y-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600 dark:text-gray-400">
              正在处理: {{ syncProgress.current }} / {{ syncProgress.total }}
            </span>
            <span class="font-medium text-primary-600 dark:text-primary-400">
              {{ syncProgress.percent }}%
            </span>
          </div>
          <UProgress :value="syncProgress.percent" size="md" />
          <p class="text-xs text-gray-500 truncate" :title="syncProgress.filename">
            📄 {{ syncProgress.filename }}
          </p>
        </div>
        
        <!-- 同步结果 -->
        <div v-if="syncResult && !syncing" 
          class="p-4 rounded-lg"
          :class="syncResult.failed > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-green-50 dark:bg-green-900/20'"
        >
          <p class="text-sm font-medium">
            {{ syncResult.message }}
          </p>
          <div class="mt-2 text-xs text-gray-500 space-y-1">
            <p v-if="syncResult.synced > 0">✅ 新上传：{{ syncResult.synced }} 张</p>
            <p v-if="syncResult.skipped > 0">⏭️ 已存在：{{ syncResult.skipped }} 张</p>
            <p v-if="syncResult.failed > 0" class="text-red-500">
              ❌ 失败：{{ syncResult.failed }} 张
              <span v-if="syncResult.errors?.length"> - {{ syncResult.errors.slice(0, 3).join('、') }}</span>
              <span v-if="(syncResult.errors?.length || 0) > 3">等...</span>
            </p>
          </div>
        </div>
        
        <UButton
          color="primary"
          variant="soft"
          :loading="syncing"
          :disabled="syncing"
          @click="handleSync"
        >
          <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 mr-1" />
          {{ syncing ? '同步中...' : '开始同步' }}
        </UButton>
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
  title: 'S3 存储配置 - 管理后台',
})

const toast = useToast()

// S3 配置类型
interface S3Config {
  enabled: boolean
  provider: 'standard-s3' | 'aliyun-oss'
  endpoint: string
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  publicUrl?: string
  useSignedUrl: boolean
  urlExpirationSeconds: number
}

// 获取当前配置
const { data: config, refresh: refreshConfig } = await useFetch<S3Config>('/api/admin/s3/config')

// 表单数据
const form = ref<S3Config>({
  enabled: false,
  provider: 'standard-s3',
  endpoint: '',
  region: 'us-east-1',
  bucket: '',
  accessKeyId: '',
  secretAccessKey: '',
  publicUrl: undefined,
  useSignedUrl: false,
  urlExpirationSeconds: 3600,
})

// 初始化表单
watchEffect(() => {
  if (config.value) {
    form.value = {
      enabled: config.value.enabled || false,
      provider: config.value.provider || 'standard-s3',
      endpoint: config.value.endpoint || '',
      region: config.value.region || 'us-east-1',
      bucket: config.value.bucket || '',
      accessKeyId: config.value.accessKeyId || '',
      secretAccessKey: config.value.secretAccessKey || '',
      publicUrl: config.value.publicUrl || '',
      useSignedUrl: config.value.useSignedUrl ?? false,
      urlExpirationSeconds: config.value.urlExpirationSeconds || 3600,
    }
  }
})

// 保存配置
const saving = ref(false)
const handleSaveConfig = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/s3/config', {
      method: 'PUT',
      body: form.value,
    })
    toast.add({
      title: '保存成功',
      description: 'S3 配置已保存',
      color: 'success',
    })
    await refreshConfig()
    refreshS3Stats()
  } catch (error: any) {
    toast.add({
      title: '保存失败',
      description: error.data?.message || error.message || '保存配置时发生错误',
      color: 'error',
    })
  } finally {
    saving.value = false
  }
}

// 测试连接
const testing = ref(false)
const handleTestConnection = async () => {
  testing.value = true
  try {
    const result = await $fetch<{ ok: boolean; message: string }>('/api/admin/s3/test', {
      method: 'POST',
      body: form.value,
    })
    if (result.ok) {
      toast.add({
        title: '连接成功',
        description: result.message,
        color: 'success',
      })
    } else {
      toast.add({
        title: '连接失败',
        description: result.message,
        color: 'error',
      })
    }
  } catch (error: any) {
    toast.add({
      title: '测试失败',
      description: error.data?.message || error.message || '测试连接时发生错误',
      color: 'error',
    })
  } finally {
    testing.value = false
  }
}

// S3 统计
const s3Stats = ref<{
  enabled: boolean
  totalSize: number
  totalSizeFormatted: string
  objectCount: number
} | null>(null)
const statsLoading = ref(false)

const refreshS3Stats = async () => {
  if (!config.value?.enabled) return
  
  statsLoading.value = true
  try {
    s3Stats.value = await $fetch('/api/admin/s3/stats')
  } catch (error) {
    console.error('获取 S3 统计失败:', error)
  } finally {
    statsLoading.value = false
  }
}

// 初始加载统计
onMounted(() => {
  if (config.value?.enabled) {
    refreshS3Stats()
  }
})

// 同步照片
const syncing = ref(false)
const syncProgress = ref<{
  current: number
  total: number
  percent: number
  filename: string
} | null>(null)
const syncResult = ref<{
  message: string
  synced: number
  failed: number
  skipped: number
  errors?: string[]
} | null>(null)

const handleSync = () => {
  syncing.value = true
  syncResult.value = null
  syncProgress.value = null
  
  // 使用 SSE 来接收实时进度
  const eventSource = new EventSource('/api/admin/s3/sync-stream')
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      
      if (data.type === 'start') {
        syncProgress.value = {
          current: 0,
          total: data.total,
          percent: 0,
          filename: '准备中...',
        }
      } else if (data.type === 'progress') {
        syncProgress.value = {
          current: data.current,
          total: data.total,
          percent: data.percent,
          filename: data.filename,
        }
      } else if (data.type === 'complete') {
        syncResult.value = {
          message: data.message,
          synced: data.synced,
          failed: data.failed,
          skipped: data.skipped,
          errors: data.errors,
        }
        
        toast.add({
          title: data.failed > 0 ? '同步完成（有失败）' : '同步完成',
          description: data.message,
          color: data.failed > 0 ? 'warning' : 'success',
        })
        
        // 刷新统计
        refreshS3Stats()
        
        syncing.value = false
        eventSource.close()
      }
    } catch (e) {
      console.error('解析 SSE 消息失败:', e)
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('SSE 连接错误:', error)
    toast.add({
      title: '同步失败',
      description: '连接中断，请稍后重试',
      color: 'error',
    })
    syncing.value = false
    eventSource.close()
  }
}
</script>
