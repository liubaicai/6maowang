<template>
  <div class="max-w-md">
    <UCard>
      <template #header>
        <h3 class="font-semibold">修改密码</h3>
      </template>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">当前密码 <span class="text-red-500">*</span></label>
          <UInput
            v-model="form.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">新密码 <span class="text-red-500">*</span></label>
          <UInput
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码"
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">确认新密码 <span class="text-red-500">*</span></label>
          <UInput
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            class="w-full"
          />
        </div>
        
        <UButton
          type="submit"
          color="primary"
          :loading="loading"
          :disabled="!canSubmit"
        >
          修改密码
        </UButton>
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
  title: '账户设置 - 管理后台',
})

const toast = useToast()
const loading = ref(false)

const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const canSubmit = computed(() => {
  return (
    form.currentPassword &&
    form.newPassword &&
    form.confirmPassword &&
    form.newPassword === form.confirmPassword &&
    form.newPassword.length >= 4
  )
})

const handleSubmit = async () => {
  if (form.newPassword !== form.confirmPassword) {
    toast.add({ title: '两次输入的密码不一致', color: 'error' })
    return
  }
  
  loading.value = true
  
  try {
    await $fetch('/api/auth/password', {
      method: 'PUT',
      body: {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      },
    })
    
    toast.add({ title: '密码修改成功', color: 'success' })
    
    // 清空表单
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
  } catch (err: any) {
    toast.add({ 
      title: '修改失败', 
      description: err.data?.message || err.message,
      color: 'error' 
    })
  } finally {
    loading.value = false
  }
}
</script>
