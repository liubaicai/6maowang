<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="text-center">
      <h1 class="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
      <p class="text-xl text-gray-500 dark:text-gray-400 mb-8">页面不存在</p>
      <UButton to="/" color="primary">返回首页</UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
})

useSeoMeta({
  title: '404 - 页面不存在',
})
</script>
