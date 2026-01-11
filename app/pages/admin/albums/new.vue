<template>
  <div class="max-w-xl">
    <UCard>
      <template #header>
        <h3 class="font-semibold">新建相册</h3>
      </template>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">相册名称 <span class="text-red-500">*</span></label>
          <UInput
            v-model="form.name"
            placeholder="请输入相册名称"
            class="w-full"
            autofocus
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">相册描述</label>
          <UTextarea
            v-model="form.description"
            placeholder="请输入相册描述（可选）"
            class="w-full"
            :rows="3"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">可见性</label>
          <USelectMenu
            v-model="form.isPublic"
            :items="visibilityOptions"
            value-key="value"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">
            私有相册只有登录用户才能查看
          </p>
        </div>
        
        <div class="flex gap-3">
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!form.name.trim()"
          >
            创建相册
          </UButton>
          <UButton
            to="/admin/albums"
            color="neutral"
            variant="ghost"
          >
            取消
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useSeoMeta({
  title: '新建相册 - 管理后台',
})

const toast = useToast()
const loading = ref(false)

const visibilityOptions = [
  { label: '公开 - 所有人可见', value: true },
  { label: '私有 - 仅登录用户可见', value: false },
]

const form = reactive({
  name: '',
  description: '',
  isPublic: true,
})

const handleSubmit = async () => {
  loading.value = true
  
  try {
    const result = await $fetch('/api/albums', {
      method: 'POST',
      body: form,
    })
    
    toast.add({ title: '创建成功', color: 'success' })
    navigateTo(`/admin/albums/${result.id}/photos`)
  } catch (err: any) {
    toast.add({ 
      title: '创建失败', 
      description: err.data?.message || err.message,
      color: 'error' 
    })
  } finally {
    loading.value = false
  }
}
</script>
