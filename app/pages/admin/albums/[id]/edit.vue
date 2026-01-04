<template>
  <div class="max-w-xl">
    <UCard>
      <template #header>
        <h3 class="font-semibold">编辑相册</h3>
      </template>
      
      <div v-if="albumPending" class="flex justify-center py-8">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-gray-400" />
      </div>
      
      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">相册名称 <span class="text-red-500">*</span></label>
          <UInput
            v-model="form.name"
            placeholder="请输入相册名称"
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">相册描述</label>
          <UTextarea
            v-model="form.description"
            placeholder="请输入相册描述（可选）"
            :rows="3"
            class="w-full"
          />
        </div>
        
        <div class="flex gap-3">
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!form.name.trim()"
          >
            保存修改
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
const route = useRoute()
const albumId = route.params.id

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useSeoMeta({
  title: '编辑相册 - 管理后台',
})

const toast = useToast()
const loading = ref(false)

// 获取相册信息
const { data: album, pending: albumPending } = await useFetch(`/api/albums/${albumId}`)

const form = reactive({
  name: '',
  description: '',
})

// 初始化表单
watch(album, (val) => {
  if (val) {
    form.name = val.name || ''
    form.description = val.description || ''
  }
}, { immediate: true })

const handleSubmit = async () => {
  loading.value = true
  
  try {
    await $fetch(`/api/albums/${albumId}`, {
      method: 'PUT',
      body: form,
    })
    
    toast.add({ title: '保存成功', color: 'success' })
    navigateTo('/admin/albums')
  } catch (err: any) {
    toast.add({ 
      title: '保存失败', 
      description: err.data?.message || err.message,
      color: 'error' 
    })
  } finally {
    loading.value = false
  }
}
</script>
