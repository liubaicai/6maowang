<template>
  <div class="fixed inset-0 z-50 bg-black" @mousemove="handleMouseMove">
    <!-- 控制栏 -->
    <div 
      class="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4 transition-opacity duration-300"
      :class="showTopBar ? 'opacity-100' : 'opacity-0 pointer-events-none'"
      @mouseenter="showTopBar = true"
    >
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center gap-4">
          <UButton
            icon="i-heroicons-x-mark"
            color="neutral"
            variant="ghost"
            size="lg"
            @click="exitSlideshow"
          />
          <span class="text-white text-lg font-medium">幻灯片放映</span>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- 播放/暂停 -->
          <UButton
            :icon="isPlaying ? 'i-heroicons-pause' : 'i-heroicons-play'"
            color="neutral"
            variant="ghost"
            size="lg"
            @click="togglePlayPause"
          />
          
          <!-- 间隔设置 -->
          <USelectMenu
            v-model="selectedInterval"
            :items="intervalOptions"
            value-key="value"
            class="w-32"
          />
          
          <!-- 切换效果显示 -->
          <!-- <span class="text-white/70 text-sm">
            效果: {{ currentTransition }}
          </span> -->
        </div>
      </div>
    </div>
    
    <!-- 顶部悬停触发区域 -->
    <div 
      class="absolute top-0 left-0 right-0 h-16 z-20 pointer-events-none"
      :class="{ 'pointer-events-auto': !showTopBar }"
      @mouseenter="showTopBar = true"
    />

    <!-- 图片容器 -->
    <div class="relative w-full h-full flex items-center justify-center">
      <Transition
        :name="currentTransitionClass"
        mode="out-in"
      >
        <div
          v-if="currentPhoto"
          :key="currentPhoto.id"
          class="absolute inset-0 flex items-center justify-center"
        >
          <img
            :src="currentPhoto.originalUrl"
            :alt="currentPhoto.originalFilename"
            class="max-w-full max-h-full object-contain"
            @load="onImageLoad"
          />
        </div>
      </Transition>

      <!-- 加载指示器 -->
      <div
        v-if="isLoading"
        class="absolute inset-0 flex items-center justify-center bg-black/50"
      >
        <UIcon name="i-heroicons-arrow-path" class="w-12 h-12 animate-spin text-white" />
      </div>

      <!-- 底部信息栏 -->
      <div
        v-if="currentPhoto"
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 transition-opacity duration-300"
        :class="showBottomBar ? 'opacity-100' : 'opacity-0 pointer-events-none'"
        @mouseenter="showBottomBar = true"
      >
        <div class="max-w-7xl mx-auto">
          <h2 class="text-white text-xl font-medium mb-2">
            {{ currentPhoto.originalFilename.replace(/\.[^.]+$/, '') }}
          </h2>
          <p class="text-white/70 text-sm">
            {{ currentIndex + 1 }} / {{ photos.length }}
            <span v-if="currentPhoto.shotAt" class="ml-4">
              📅 {{ formatDate(currentPhoto.shotAt) }}
            </span>
          </p>
        </div>
      </div>
      
      <!-- 底部悬停触发区域 -->
      <div 
        class="absolute bottom-0 left-0 right-0 h-16 z-20 pointer-events-none"
        :class="{ 'pointer-events-auto': !showBottomBar }"
        @mouseenter="showBottomBar = true"
      />
    </div>

    <!-- 左右控制按钮 -->
    <button
      class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all duration-300"
      :class="showControls ? 'opacity-100' : 'opacity-0'"
      @click="previousPhoto"
    >
      <UIcon name="i-heroicons-chevron-left" class="w-8 h-8 text-white" />
    </button>
    
    <button
      class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-all duration-300"
      :class="showControls ? 'opacity-100' : 'opacity-0'"
      @click="nextPhoto"
    >
      <UIcon name="i-heroicons-chevron-right" class="w-8 h-8 text-white" />
    </button>
  </div>
</template>

<script setup lang="ts">
import type { RandomPhoto } from '~/types'

// SEO
useSeoMeta({
  title: '幻灯片放映 - 遛猫网',
})

// 定义布局
definePageMeta({
  layout: false,
})

// 定义过渡效果
const transitions = [
  { name: 'fade', label: '淡入淡出' },
  { name: 'slide-left', label: '左滑' },
  { name: 'slide-right', label: '右滑' },
  { name: 'slide-up', label: '上滑' },
  { name: 'slide-down', label: '下滑' },
  { name: 'zoom', label: '缩放' },
  { name: 'rotate', label: '旋转' },
]

// 状态
const photos = ref<RandomPhoto[]>([])
const currentIndex = ref(0)
const currentPhoto = computed(() => photos.value[currentIndex.value])
const isPlaying = ref(true)
const isLoading = ref(true)
const currentTransition = ref('淡入淡出')
const currentTransitionClass = ref('fade')

// 控制栏显示状态
const showTopBar = ref(false)
const showBottomBar = ref(false)
const showControls = ref(false)
let hideTimer: NodeJS.Timeout | null = null

// 处理鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  const { clientY, clientX } = e
  const windowHeight = window.innerHeight
  const windowWidth = window.innerWidth
  
  // 鼠标在顶部区域
  if (clientY < 80) {
    showTopBar.value = true
  }
  
  // 鼠标在底部区域
  if (clientY > windowHeight - 100) {
    showBottomBar.value = true
  }
  
  // 鼠标在左右边缘区域显示控制按钮
  if (clientX < 100 || clientX > windowWidth - 100) {
    showControls.value = true
  }
  
  // 重置隐藏计时器
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
  
  hideTimer = setTimeout(() => {
    showTopBar.value = false
    showBottomBar.value = false
    showControls.value = false
  }, 3000) // 3秒后隐藏
}

// 间隔选项
const intervalOptions = [
  { label: '10 秒', value: 10000 },
  { label: '20 秒', value: 20000 },
  { label: '30 秒', value: 30000 },
  { label: '60 秒', value: 60000 },
]
const selectedInterval = ref(20000)
const interval = computed(() => selectedInterval.value ?? 20000)

let timer: NodeJS.Timeout | null = null

// 加载随机照片
const loadPhotos = async () => {
  try {
    isLoading.value = true
    const data = await $fetch<RandomPhoto[]>('/api/photos/random', {
      query: { count: 50 }, // 加载 50 张随机照片
    })
    photos.value = data
    
    if (photos.value.length === 0) {
      // 没有照片，返回首页
      await navigateTo('/')
      return
    }
    
    isLoading.value = false
  } catch (error) {
    console.error('Failed to load photos:', error)
    await navigateTo('/')
  }
}

// 选择随机过渡效果
const selectRandomTransition = () => {
  const randomIndex = Math.floor(Math.random() * transitions.length)
  const transition = transitions[randomIndex]
  if (transition) {
    currentTransitionClass.value = transition.name
    currentTransition.value = transition.label
  }
}

// 下一张照片
const nextPhoto = () => {
  selectRandomTransition()
  const nextIndex = (currentIndex.value + 1) % photos.value.length
  
  // 如果即将循环回第一张，加载新的照片
  if (nextIndex === 0) {
    loadNewPhotos()
  } else {
    currentIndex.value = nextIndex
  }
}

// 加载新的一批照片
const loadNewPhotos = async () => {
  try {
    isLoading.value = true
    const data = await $fetch<RandomPhoto[]>('/api/photos/random', {
      query: { count: 50 },
    })
    
    if (data.length > 0) {
      photos.value = data
      currentIndex.value = 0
    }
    
    isLoading.value = false
  } catch (error) {
    console.error('Failed to load new photos:', error)
    // 加载失败时继续循环当前照片
    currentIndex.value = 0
    isLoading.value = false
  }
}

// 上一张照片
const previousPhoto = () => {
  selectRandomTransition()
  currentIndex.value = (currentIndex.value - 1 + photos.value.length) % photos.value.length
}

// 切换播放/暂停
const togglePlayPause = () => {
  isPlaying.value = !isPlaying.value
  if (isPlaying.value) {
    startTimer()
  } else {
    stopTimer()
  }
}

// 启动计时器
const startTimer = () => {
  stopTimer()
  timer = setInterval(() => {
    nextPhoto()
  }, interval.value)
}

// 停止计时器
const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 退出幻灯片
const exitSlideshow = async () => {
  stopTimer()
  await exitFullscreen()
  navigateTo('/')
}

// 图片加载完成
const onImageLoad = () => {
  isLoading.value = false
}

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 监听间隔变化
watch(selectedInterval, () => {
  if (isPlaying.value) {
    startTimer()
  }
})

// 键盘控制
const handleKeydown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowLeft':
      previousPhoto()
      break
    case 'ArrowRight':
    case ' ':
      e.preventDefault()
      nextPhoto()
      break
    case 'Escape':
      exitSlideshow()
      break
    case 'p':
    case 'P':
      togglePlayPause()
      break
  }
}

// 请求全屏
const requestFullscreen = async () => {
  try {
    const elem = document.documentElement
    if (elem.requestFullscreen) {
      await elem.requestFullscreen()
    } else if ((elem as any).webkitRequestFullscreen) {
      await (elem as any).webkitRequestFullscreen()
    } else if ((elem as any).msRequestFullscreen) {
      await (elem as any).msRequestFullscreen()
    }
  } catch (error) {
    console.warn('Fullscreen request failed:', error)
  }
}

// 退出全屏
const exitFullscreen = async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else if ((document as any).webkitFullscreenElement) {
      await (document as any).webkitExitFullscreen()
    } else if ((document as any).msFullscreenElement) {
      await (document as any).msExitFullscreen()
    }
  } catch (error) {
    console.warn('Exit fullscreen failed:', error)
  }
}

// Screen Wake Lock - 防止系统锁屏或关闭显示器
let wakeLock: WakeLockSentinel | null = null

const requestWakeLock = async () => {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen')
      console.log('Wake Lock 已激活')
      
      // 监听 Wake Lock 释放事件
      wakeLock.addEventListener('release', () => {
        console.log('Wake Lock 已释放')
      })
    }
  } catch (error) {
    console.warn('Wake Lock 请求失败:', error)
  }
}

const releaseWakeLock = async () => {
  if (wakeLock) {
    try {
      await wakeLock.release()
      wakeLock = null
    } catch (error) {
      console.warn('Wake Lock 释放失败:', error)
    }
  }
}

// 页面可见性变化时重新请求 Wake Lock
const handleVisibilityChange = async () => {
  if (document.visibilityState === 'visible' && isPlaying.value) {
    await requestWakeLock()
  }
}

// 生命周期
onMounted(async () => {
  await loadPhotos()
  if (photos.value.length > 0) {
    startTimer()
    window.addEventListener('keydown', handleKeydown)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    // 自动进入全屏
    await requestFullscreen()
    // 请求 Wake Lock 防止锁屏
    await requestWakeLock()
  }
})

onUnmounted(() => {
  stopTimer()
  if (hideTimer) {
    clearTimeout(hideTimer)
  }
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  // 释放 Wake Lock
  releaseWakeLock()
})
</script>

<style scoped>
/* 淡入淡出 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.8s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 左滑 */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.8s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

/* 右滑 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.8s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* 上滑 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.8s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

/* 下滑 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.8s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(100%);
}

/* 缩放 */
.zoom-enter-active,
.zoom-leave-active {
  transition: all 0.8s ease;
}

.zoom-enter-from {
  opacity: 0;
  transform: scale(0.8);
}

.zoom-leave-to {
  opacity: 0;
  transform: scale(1.2);
}

/* 旋转 */
.rotate-enter-active,
.rotate-leave-active {
  transition: all 0.8s ease;
}

.rotate-enter-from {
  opacity: 0;
  transform: rotate(-180deg) scale(0.8);
}

.rotate-leave-to {
  opacity: 0;
  transform: rotate(180deg) scale(0.8);
}
</style>
