<template>
  <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p class="text-sm text-gray-500">
           Copyright © <a href="https://github.com/liubaicai">菜园子</a> {{ new Date().getFullYear() }}, <a
			href="https://beian.miit.gov.cn/">京ICP备14022168号-2</a>
        </p>
        <div class="flex items-center gap-4">
          <NuxtLink 
            to="/" 
            class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            首页
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
