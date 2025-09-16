<template>
  <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
    <!-- 导航栏 -->
    <AppHeader />
    
    <!-- 主内容 -->
    <main class="flex-1">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <slot />
      </div>
    </main>
    
    <!-- 页脚 -->
    <AppFooter />
    
    <!-- 通知 -->
    <UToaster />
  </div>
</template>
