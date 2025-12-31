<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-sm">
      <!-- Logo -->
      <div class="text-center mb-8">
        <UIcon name="i-heroicons-camera" class="w-16 h-16 text-primary-500 mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">登录</h1>
        <p class="mt-2 text-gray-500 dark:text-gray-400">登录到遛猫网管理后台</p>
      </div>
      
      <!-- 登录表单 -->
      <UCard>
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">用户名</label>
            <UInput
              v-model="form.username"
              placeholder="请输入用户名"
              autofocus
              class="w-full"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">密码</label>
            <UInput
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              class="w-full"
            />
          </div>
          
          <UButton
            type="submit"
            block
            class="w-full"
            :loading="loading"
            :disabled="!form.username || !form.password"
          >
            登录
          </UButton>
        </form>
      </UCard>
      
      <!-- 返回首页 -->
      <div class="text-center mt-6">
        <NuxtLink 
          to="/" 
          class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          返回首页
        </NuxtLink>
      </div>
    </div>
    
    <!-- Toast 通知 -->
    <UToaster />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

useSeoMeta({
  title: '登录 - 遛猫网',
})

const toast = useToast()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const handleLogin = async () => {
  loading.value = true
  
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: form,
    })
    
    toast.add({ title: '登录成功', color: 'success' })
    navigateTo('/admin')
  } catch (err: any) {
    toast.add({ 
      title: '登录失败', 
      description: err.data?.message || '用户名或密码错误',
      color: 'error' 
    })
  } finally {
    loading.value = false
  }
}
</script>
