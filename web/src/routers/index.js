import Vue from 'vue'
import Router from 'vue-router'
import NProgress from 'nprogress'

// 修正router组件bug，隐藏导航到自身时会报错信息
const originalPush = Router.prototype.push
Router.prototype.push = function push(location) {
  return originalPush.call(this, location).catch((err) => err)
}

Vue.use(Router)

const router = new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/gallery/Index.vue'),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: '/gallery/:id',
      name: 'gallery',
      component: () => import('@/views/photo/Index.vue'),
      meta: {
        requiresAuth: false,
      },
    },
    {
      path: '/manager',
      component: () => import('@/views/manager/Index.vue'),
      meta: {
        requiresAuth: true,
      },
      children: [
        {
          path: 'gallery',
          name: 'manager-gallery',
          component: () => import('@/views/manager/gallery/Index.vue'),
        },
        {
          path: 'settings',
          name: 'manager-settings',
          component: () => import('@/views/manager/settings/Index.vue'),
        },
        {
          path: '',
          redirect: 'gallery',
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  NProgress.start()
  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
