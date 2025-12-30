<template>
  <div class="fixed inset-0 z-50 bg-black">
    <!-- 控制栏 -->
    <div class="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
      <div class="flex items-center justify-between max-w-7xl mx-auto">
        <div class="flex items-center gap-4">
          <UButton
            icon="i-heroicons-x-mark"
            color="white"
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
            color="white"
            variant="ghost"
            size="lg"
            @click="togglePlayPause"
          />
          
          <!-- 间隔设置 -->
          <USelectMenu
            v-model="interval"
            :options="intervalOptions"
            value-attribute="value"
            option-attribute="label"
            class="w-32"
          >
            <template #label>
              <span class="text-white">{{ interval / 1000 }}s</span>
            </template>
          </USelectMenu>
          
          <!-- 切换效果显示 -->
          <span class="text-white/70 text-sm">
            效果: {{ currentTransition }}
          </span>
        </div>
      </div>
    </div>

    <!-- 图片容器 -->
    <div class="relative w-full h-full flex items-center justify-center">
      <Transition
        :name="currentTransitionClass"
        mode="out-in"
      >
        <div
          v-if="currentPhoto"
          :key="currentPhoto.id"
          class="absolute inset-0 flex items-center justify-center p-8"
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
        class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6"
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
    </div>

    <!-- 左右控制按钮 -->
    <button
      class="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
      @click="previousPhoto"
    >
      <UIcon name="i-heroicons-chevron-left" class="w-8 h-8 text-white" />
    </button>
    
    <button
      class="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
      @click="nextPhoto"
    >
      <UIcon name="i-heroicons-chevron-right" class="w-8 h-8 text-white" />
    </button>
  </div>
</template>

<script setup lang="ts">
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
const photos = ref<any[]>([])
const currentIndex = ref(0)
const currentPhoto = computed(() => photos.value[currentIndex.value])
const isPlaying = ref(true)
const isLoading = ref(true)
const currentTransition = ref('淡入淡出')
const currentTransitionClass = ref('fade')

// 间隔选项
const intervalOptions = [
  { label: '3 秒', value: 3000 },
  { label: '5 秒', value: 5000 },
  { label: '8 秒', value: 8000 },
  { label: '10 秒', value: 10000 },
]
const interval = ref(5000)

let timer: NodeJS.Timeout | null = null

// 加载随机照片
const loadPhotos = async () => {
  try {
    isLoading.value = true
    const data = await $fetch('/api/photos/random', {
      query: { count: 50 }, // 加载 50 张随机照片
    })
    photos.value = data as any[]
    
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
  currentTransitionClass.value = transition.name
  currentTransition.value = transition.label
}

// 下一张照片
const nextPhoto = () => {
  selectRandomTransition()
  currentIndex.value = (currentIndex.value + 1) % photos.value.length
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
const exitSlideshow = () => {
  stopTimer()
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
watch(interval, () => {
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

// 生命周期
onMounted(async () => {
  await loadPhotos()
  if (photos.value.length > 0) {
    startTimer()
    window.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  stopTimer()
  window.removeEventListener('keydown', handleKeydown)
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
