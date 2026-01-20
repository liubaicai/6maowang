// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // 启用 Nitro WebSocket 支持
  nitro: {
    experimental: {
      websocket: true,
    },
  },

  // 模块
  modules: [
    '@nuxt/ui',
    '@nuxt/image',
    'nuxt-auth-utils',
  ],

  // 字体配置：禁用 Google 和 Fontshare 以解决连接问题
  fonts: {
    providers: {
      google: false,
      googleicons: false,
      fontshare: false,
    },
  },

  // CSS
  css: ['~/assets/css/main.css'],

  // 运行时配置
  runtimeConfig: {
    // 服务端私有配置
    adminPassword: process.env.ADMIN_PASSWORD || 'admin',
    maxFileSize: Number(process.env.MAX_FILE_SIZE) || 30, // MB
    // 公开配置
    public: {
      appName: '遛猫网',
    },
  },

  // Nuxt UI 配置
  ui: {
    theme: {
      colors: ['primary', 'secondary', 'success', 'warning', 'error', 'info'],
    },
  },

  // 颜色模式
  colorMode: {
    preference: 'system',
    fallback: 'dark',
  },

  // 应用配置
  app: {
    head: {
      title: '遛猫网',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '刘白菜的个人相册' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  // 图片优化
  image: {
    dir: 'public',
    quality: 80,
  },

  // TypeScript
  typescript: {
    strict: true,
  },
})
