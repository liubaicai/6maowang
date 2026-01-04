<template>
  <div class="max-w-2xl space-y-6">
    <!-- 昵称设置 -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">个人信息</h3>
      </template>
      
      <form @submit.prevent="handleNicknameSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">用户名</label>
          <UInput
            :value="(session?.user as any)?.username"
            disabled
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">昵称</label>
          <UInput
            v-model="nicknameForm.nickname"
            placeholder="请输入昵称（可选）"
            class="w-full"
          />
          <p class="text-xs text-gray-500 mt-1">留空则使用用户名作为显示名称</p>
        </div>
        
        <UButton
          type="submit"
          color="primary"
          :loading="nicknameLoading"
        >
          保存昵称
        </UButton>
      </form>
    </UCard>
    
    <!-- 修改密码 -->
    <UCard>
      <template #header>
        <h3 class="font-semibold">修改密码</h3>
      </template>
      
      <form @submit.prevent="handlePasswordSubmit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">当前密码 <span class="text-red-500">*</span></label>
          <UInput
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">新密码 <span class="text-red-500">*</span></label>
          <UInput
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            class="w-full"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium mb-1">确认新密码 <span class="text-red-500">*</span></label>
          <UInput
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            class="w-full"
          />
        </div>
        
        <UButton
          type="submit"
          color="primary"
          :loading="passwordLoading"
          :disabled="!canSubmitPassword"
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
const { data: session, refresh: refreshSession } = await useFetch('/api/auth/session')

// 昵称表单
const nicknameLoading = ref(false)
const nicknameForm = reactive({
  nickname: (session.value?.user as any)?.nickname || '',
})

// 密码表单
const passwordLoading = ref(false)
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const canSubmitPassword = computed(() => {
  return (
    passwordForm.currentPassword &&
    passwordForm.newPassword &&
    passwordForm.confirmPassword &&
    passwordForm.newPassword === passwordForm.confirmPassword &&
    passwordForm.newPassword.length >= 4
  )
})

const handleNicknameSubmit = async () => {
  nicknameLoading.value = true
  
  try {
    await $fetch('/api/auth/nickname', {
      method: 'PUT',
      body: {
        nickname: nicknameForm.nickname,
      },
    })
    
    toast.add({ title: '昵称保存成功', color: 'success' })
    
    // 刷新 session
    await refreshSession()
  } catch (err: any) {
    toast.add({ 
      title: '保存失败', 
      description: err.data?.message || err.message,
      color: 'error' 
    })
  } finally {
    nicknameLoading.value = false
  }
}

const handlePasswordSubmit = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    toast.add({ title: '两次输入的密码不一致', color: 'error' })
    return
  }
  
  passwordLoading.value = true
  
  try {
    await $fetch('/api/auth/password', {
      method: 'PUT',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      },
    })
    
    toast.add({ title: '密码修改成功', color: 'success' })
    
    // 清空表单
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } catch (err: any) {
    toast.add({ 
      title: '修改失败', 
      description: err.data?.message || err.message,
      color: 'error' 
    })
  } finally {
    passwordLoading.value = false
  }
}
</script>
