<template>
  <div>
    <!-- 操作按钮 -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h2 class="text-lg font-semibold">用户管理</h2>
        <p class="text-sm text-gray-500 mt-1">管理系统用户和权限</p>
      </div>
      <UButton
        icon="i-heroicons-plus"
        color="primary"
        @click="openCreateModal"
      >
        新建用户
      </UButton>
    </div>
    
    <!-- 用户列表 -->
    <UCard>
      <div v-if="pending" class="flex justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-gray-400" />
      </div>
      
      <div v-else-if="users && users.length > 0" class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="text-left py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">用户名</th>
              <th class="text-left py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">昵称</th>
              <th class="text-left py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">角色</th>
              <th class="text-left py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">创建时间</th>
              <th class="text-right py-3 px-4 font-medium text-sm text-gray-700 dark:text-gray-300">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in users"
              :key="user.id"
              class="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <td class="py-3 px-4">
                <div class="font-medium">{{ user.username }}</div>
              </td>
              <td class="py-3 px-4">
                <div class="text-gray-600 dark:text-gray-400">{{ user.nickname || '-' }}</div>
              </td>
              <td class="py-3 px-4">
                <UBadge :color="user.role === 'admin' ? 'primary' : 'neutral'" variant="soft">
                  {{ user.role === 'admin' ? '管理员' : '普通用户' }}
                </UBadge>
              </td>
              <td class="py-3 px-4">
                <div class="text-sm text-gray-500">{{ formatDate(user.createdAt) }}</div>
              </td>
              <td class="py-3 px-4 text-right">
                <UButton
                  icon="i-heroicons-pencil"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="openEditModal(user)"
                >
                  编辑
                </UButton>
                <UButton
                  icon="i-heroicons-trash"
                  color="error"
                  variant="ghost"
                  size="sm"
                  @click="confirmDeleteUser(user)"
                >
                  删除
                </UButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div v-else class="py-12 text-center text-gray-500">
        暂无用户
      </div>
    </UCard>
    
    <!-- 创建/编辑用户模态框 -->
    <UModal v-model:open="showModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold">{{ editingUser ? '编辑用户' : '新建用户' }}</h3>
          </template>
          
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">用户名 <span class="text-red-500">*</span></label>
              <UInput
                v-model="form.username"
                placeholder="请输入用户名"
                class="w-full"
              />
              <p class="text-xs text-gray-500 mt-1">3-20 个字符</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">昵称</label>
              <UInput
                v-model="form.nickname"
                placeholder="请输入昵称（可选）"
                class="w-full"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">
                密码 <span v-if="!editingUser" class="text-red-500">*</span>
              </label>
              <UInput
                v-model="form.password"
                type="password"
                :placeholder="editingUser ? '留空则不修改密码' : '请输入密码'"
                class="w-full"
              />
              <p class="text-xs text-gray-500 mt-1">至少 4 个字符</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium mb-1">角色</label>
              <select v-model="form.role" class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                <option value="admin">管理员</option>
                <option value="user">普通用户</option>
              </select>
            </div>
          </form>
          
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                color="neutral"
                variant="soft"
                @click="showModal = false"
              >
                取消
              </UButton>
              <UButton
                color="primary"
                :loading="submitting"
                @click="handleSubmit"
              >
                {{ editingUser ? '保存' : '创建' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
    
    <!-- 删除确认模态框 -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold text-red-600">确认删除</h3>
          </template>
          
          <p class="text-gray-600 dark:text-gray-400">
            确定要删除用户 <strong>{{ deletingUser?.username }}</strong> 吗？此操作不可撤销。
          </p>
          
          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                color="neutral"
                variant="soft"
                @click="showDeleteModal = false"
              >
                取消
              </UButton>
              <UButton
                color="error"
                :loading="deleting"
                @click="handleDelete"
              >
                删除
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

useSeoMeta({
  title: '用户管理 - 管理后台',
})

const toast = useToast()

// 获取用户列表
const { data: users, pending, refresh } = await useFetch('/api/admin/users')

// 模态框状态
const showModal = ref(false)
const editingUser = ref<any>(null)
const submitting = ref(false)

// 删除相关状态
const showDeleteModal = ref(false)
const deletingUser = ref<any>(null)
const deleting = ref(false)

// 表单数据
const form = reactive({
  username: '',
  nickname: '',
  password: '',
  role: 'user',
})

// 打开创建模态框
const openCreateModal = () => {
  editingUser.value = null
  form.username = ''
  form.nickname = ''
  form.password = ''
  form.role = 'user'
  showModal.value = true
}

// 打开编辑模态框
const openEditModal = (user: any) => {
  editingUser.value = user
  form.username = user.username
  form.nickname = user.nickname || ''
  form.password = ''
  form.role = user.role
  showModal.value = true
}

// 提交表单
const handleSubmit = async () => {
  // 验证
  if (!form.username) {
    toast.add({ title: '请输入用户名', color: 'error' })
    return
  }
  
  if (form.username.length < 3 || form.username.length > 20) {
    toast.add({ title: '用户名长度必须在 3-20 个字符之间', color: 'error' })
    return
  }
  
  if (!editingUser.value && !form.password) {
    toast.add({ title: '请输入密码', color: 'error' })
    return
  }
  
  if (form.password && form.password.length < 4) {
    toast.add({ title: '密码至少 4 个字符', color: 'error' })
    return
  }
  
  submitting.value = true
  
  try {
    if (editingUser.value) {
      // 更新用户
      await $fetch(`/api/admin/users/${editingUser.value.id}`, {
        method: 'PUT',
        body: {
          username: form.username,
          nickname: form.nickname,
          password: form.password || undefined,
          role: form.role,
        },
      })
      toast.add({ title: '用户更新成功', color: 'success' })
    } else {
      // 创建用户
      await $fetch('/api/admin/users', {
        method: 'POST',
        body: {
          username: form.username,
          nickname: form.nickname,
          password: form.password,
          role: form.role,
        },
      })
      toast.add({ title: '用户创建成功', color: 'success' })
    }
    
    showModal.value = false
    refresh()
  } catch (err: any) {
    toast.add({ 
      title: '操作失败', 
      description: err.data?.message || err.message,
      color: 'error' 
    })
  } finally {
    submitting.value = false
  }
}

// 确认删除用户
const confirmDeleteUser = (user: any) => {
  deletingUser.value = user
  showDeleteModal.value = true
}

// 删除用户
const handleDelete = async () => {
  if (!deletingUser.value) return
  
  deleting.value = true
  
  try {
    await $fetch(`/api/admin/users/${deletingUser.value.id}`, {
      method: 'DELETE',
    })
    toast.add({ title: '用户删除成功', color: 'success' })
    showDeleteModal.value = false
    refresh()
  } catch (err: any) {
    toast.add({ 
      title: '删除失败', 
      description: err.data?.message || err.message,
      color: 'error' 
    })
  } finally {
    deleting.value = false
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}
</script>
