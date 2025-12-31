<template>
  <!-- 紧凑模式 -->
  <div v-if="compact" class="relative">
    <!-- 只有在没选择文件且没在上传时才显示文件选择器 -->
    <input
      v-if="files.length === 0 && !uploading"
      ref="fileInput"
      type="file"
      multiple
      accept="image/*"
      class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      @change="onFileSelect"
    />
    
    <div v-if="uploading" class="text-sm text-gray-500">
      <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin inline mr-1" />
      {{ progressText }}
    </div>
    <div v-else-if="files.length > 0" class="flex flex-col gap-2">
      <p class="text-sm text-primary-600 dark:text-primary-400 font-medium">
        已选择 {{ files.length }} 个文件
      </p>
      <div class="flex items-center gap-2">
        <UButton 
          size="xs" 
          color="primary"
          @click="upload"
        >
          上传
        </UButton>
        <UButton 
          size="xs" 
          color="neutral" 
          variant="ghost"
          @click="clearFiles"
        >
          清除
        </UButton>
      </div>
    </div>
    <div v-else class="pointer-events-none">
      <p class="text-sm font-medium text-gray-900 dark:text-white">
        点击上传照片
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        支持拖拽多张图片
      </p>
    </div>
  </div>

  <!-- 标准模式 -->
  <template v-else>
    <div
      class="upload-dropzone relative rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center transition-all"
      :class="{ 'dragover': isDragOver, 'border-primary-500 bg-primary-50 dark:bg-primary-950': isDragOver }"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="onDragLeave"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        @change="onFileSelect"
      />
      
      <div class="pointer-events-none">
        <UIcon name="i-heroicons-cloud-arrow-up" class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        <p class="text-lg font-medium text-gray-900 dark:text-white mb-1">
          点击选择或拖拽图片到此处
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          支持 JPG、PNG、WebP、GIF 格式，单文件最大 30MB
        </p>
      </div>
      
      <!-- 已选择的文件 -->
      <div v-if="files.length > 0" class="mt-6 pointer-events-none">
        <p class="text-sm text-primary-600 dark:text-primary-400 font-medium">
          已选择 {{ files.length }} 个文件
        </p>
      </div>
    </div>
    
    <!-- 上传按钮 -->
    <div v-if="files.length > 0" class="mt-4 flex items-center gap-4">
      <UButton 
        color="primary" 
        :loading="uploading"
        :disabled="uploading"
        @click="upload"
      >
        {{ uploading ? '上传中...' : `上传 ${files.length} 张照片` }}
      </UButton>
      <UButton 
        color="neutral" 
        variant="ghost"
        :disabled="uploading"
        @click="clearFiles"
      >
        清除
      </UButton>
    </div>
    
    <!-- 上传进度 -->
    <div v-if="uploading" class="mt-4">
      <UProgress :value="progress" />
      <p class="text-sm text-gray-500 mt-2">{{ progressText }}</p>
    </div>
  </template>
</template>

<script setup lang="ts">
const props = defineProps<{
  albumId: number
  compact?: boolean
}>()

const emit = defineEmits<{
  uploaded: [result: any]
}>()

const toast = useToast()
const fileInput = ref<HTMLInputElement>()
const files = ref<File[]>([])
const isDragOver = ref(false)
const uploading = ref(false)
const progress = ref(0)
const progressText = ref('')

const onDragOver = () => {
  isDragOver.value = true
}

const onDragLeave = () => {
  isDragOver.value = false
}

const onDrop = (e: DragEvent) => {
  isDragOver.value = false
  const droppedFiles = e.dataTransfer?.files
  if (droppedFiles) {
    files.value = Array.from(droppedFiles).filter(f => f.type.startsWith('image/'))
  }
}

const onFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files) {
    files.value = Array.from(input.files)
  }
}

const clearFiles = () => {
  files.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const upload = async () => {
  if (files.value.length === 0) return
  
  uploading.value = true
  progress.value = 0
  progressText.value = '准备上传...'
  
  try {
    const formData = new FormData()
    formData.append('albumId', String(props.albumId))
    
    for (const file of files.value) {
      formData.append('photos', file)
    }
    
    progressText.value = `正在上传 ${files.value.length} 张照片...`
    progress.value = 50
    
    const result = await $fetch('/api/photos/upload', {
      method: 'POST',
      body: formData,
    })
    
    progress.value = 100
    progressText.value = '上传完成！'
    
    toast.add({ 
      title: '上传成功', 
      description: `成功上传 ${result.count} 张照片`,
      color: 'success' 
    })
    
    clearFiles()
    emit('uploaded', result)
  } catch (err: any) {
    toast.add({ 
      title: '上传失败', 
      description: err.message || '请稍后重试',
      color: 'error' 
    })
  } finally {
    uploading.value = false
  }
}
</script>
