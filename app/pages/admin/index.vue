<template>
  <div>
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 flex items-center justify-center bg-primary-100 dark:bg-primary-900 rounded-lg">
            <UIcon name="i-heroicons-folder" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">相册数量</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stats?.albumCount || 0 }}
            </p>
          </div>
        </div>
      </UCard>
      
      <UCard>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 flex items-center justify-center bg-green-100 dark:bg-green-900 rounded-lg">
            <UIcon name="i-heroicons-photo" class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">照片数量</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stats?.photoCount || 0 }}
            </p>
          </div>
        </div>
      </UCard>
      
      <UCard>
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900 rounded-lg">
            <UIcon name="i-heroicons-circle-stack" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">存储占用</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ stats?.storageSizeFormatted || '0 B' }}
            </p>
          </div>
        </div>
      </UCard>
    </div>
    
    <!-- 系统信息 -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-server" class="w-5 h-5 text-gray-500" />
            <h3 class="font-semibold">系统信息</h3>
          </div>
          <div class="flex items-center gap-2 text-xs">
            <span 
              class="flex items-center gap-1"
              :class="wsConnected ? 'text-green-500' : 'text-gray-400'"
            >
              <span 
                class="w-2 h-2 rounded-full" 
                :class="wsConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'"
              ></span>
              {{ wsConnected ? '实时更新' : '离线' }}
            </span>
          </div>
        </div>
      </template>
      
      <div v-if="systemInfo" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- 硬件信息 -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <UIcon name="i-heroicons-cpu-chip" class="w-4 h-4" />
            <span>硬件信息</span>
          </div>
          <div class="space-y-1.5 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">CPU</span>
              <span class="text-gray-900 dark:text-white font-medium truncate ml-2 max-w-72" :title="systemInfo.cpu.model">{{ systemInfo.cpu.model }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">核心数</span>
              <span class="text-gray-900 dark:text-white">{{ systemInfo.cpu.cores }} 核心</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">总内存</span>
              <span class="text-gray-900 dark:text-white">{{ systemInfo.memory.total }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">架构</span>
              <span class="text-gray-900 dark:text-white">{{ systemInfo.arch }}</span>
            </div>
          </div>
        </div>
        
        <!-- 系统信息 -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <UIcon name="i-heroicons-server" class="w-4 h-4" />
            <span>系统信息</span>
          </div>
          <div class="space-y-1.5 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">主机名</span>
              <span class="text-gray-900 dark:text-white">{{ systemInfo.hostname }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">系统</span>
              <span class="text-gray-900 dark:text-white">{{ systemInfo.osInfo?.distro || systemInfo.platform }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">内核</span>
              <span class="text-gray-900 dark:text-white truncate ml-2 max-w-72" :title="systemInfo.osInfo?.kernel">{{ systemInfo.osInfo?.kernel || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">运行时间</span>
              <span class="text-gray-900 dark:text-white">{{ systemInfo.uptime }}</span>
            </div>
          </div>
        </div>
        
        <!-- 负载状态 -->
        <div class="space-y-3">
          <div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <UIcon name="i-heroicons-chart-bar" class="w-4 h-4" />
            <span>负载状态</span>
          </div>
          <div class="space-y-1.5 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">CPU 负载</span>
              <span class="text-gray-900 dark:text-white">{{ systemInfo.cpu.load.join(' / ') }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">CPU 占用</span>
              <span :class="getUsageClass(systemInfo.cpu.usage)">{{ systemInfo.cpu.usage }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">内存占用</span>
              <span :class="getUsageClass(systemInfo.memory.usage)">{{ systemInfo.memory.usage }}% ({{ systemInfo.memory.used }})</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">网络</span>
              <span class="text-gray-900 dark:text-white">{{ systemInfo.network.length > 0 ? systemInfo.network?.[0]?.ip : '-' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="flex items-center justify-center py-8 text-gray-400">
        <UIcon name="i-heroicons-arrow-path" class="w-5 h-5 animate-spin mr-2" />
        加载中...
      </div>
    </UCard>
    
    <!-- 快捷操作 -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">快捷操作</h3>
      </template>
      
      <div class="flex flex-wrap gap-3">
        <UButton to="/admin/albums/new" color="primary">
          <UIcon name="i-heroicons-plus" class="w-4 h-4 mr-1" />
          新建相册
        </UButton>
        <UButton to="/admin/albums" color="neutral" variant="soft">
          <UIcon name="i-heroicons-folder" class="w-4 h-4 mr-1" />
          管理相册
        </UButton>
        <UButton to="/" color="neutral" variant="ghost" target="_blank">
          <UIcon name="i-heroicons-eye" class="w-4 h-4 mr-1" />
          查看前台
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
  title: '仪表盘 - 管理后台',
})

// 获取统计数据
const { data: stats } = await useFetch('/api/stats')

// 获取系统信息（初始加载）
const { data: systemInfoData } = await useFetch('/api/system', {
  server: false, // 仅在客户端获取，避免服务端渲染问题
})

// 创建响应式的系统信息对象用于实时更新
const systemInfo = ref<typeof systemInfoData.value>(null)

// 初始化系统信息
watch(systemInfoData, (val) => {
  if (val) {
    systemInfo.value = JSON.parse(JSON.stringify(val))
  }
}, { immediate: true })

// WebSocket 连接状态
const wsConnected = ref(false)
const lastUpdate = ref<Date | null>(null)

// WebSocket 相关变量
let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

const connectWebSocket = () => {
  // 如果已有连接，先关闭
  if (ws) {
    ws.close()
    ws = null
  }
  
  // 构建 WebSocket URL
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/api/ws/system`
  
  ws = new WebSocket(wsUrl)
  
  ws.onopen = () => {
    console.log('[WebSocket] 已连接到系统信息服务')
    wsConnected.value = true
  }
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      // 更新实时数据（CPU、内存、运行时间）
      if (systemInfo.value && data.cpu) {
        // 使用新对象触发响应式更新
        systemInfo.value = {
          ...systemInfo.value,
          cpu: {
            ...systemInfo.value.cpu,
            usage: data.cpu.usage,
            load: data.cpu.load,
          },
          memory: data.memory,
          uptime: data.uptime,
          uptimeSeconds: data.uptimeSeconds,
        }
        lastUpdate.value = new Date()
      }
    } catch (e) {
      console.error('[WebSocket] 解析消息失败:', e)
    }
  }
  
  ws.onclose = () => {
    console.log('[WebSocket] 连接已关闭')
    wsConnected.value = false
    ws = null
    // 5 秒后重连
    reconnectTimer = setTimeout(connectWebSocket, 5000)
  }
  
  ws.onerror = (error) => {
    console.error('[WebSocket] 连接错误:', error)
    wsConnected.value = false
  }
}

// 设置 WebSocket 实时更新
onMounted(() => {
  connectWebSocket()
})

// 清理 WebSocket 连接
onUnmounted(() => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (ws) {
    ws.close()
    ws = null
  }
})

// 根据使用率返回样式类
const getUsageClass = (usage: number): string => {
  if (usage >= 90) return 'text-red-600 dark:text-red-400 font-medium'
  if (usage >= 70) return 'text-yellow-600 dark:text-yellow-400 font-medium'
  return 'text-green-600 dark:text-green-400 font-medium'
}
</script>
