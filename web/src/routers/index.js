import Vue from 'vue'
import Router from 'vue-router'
import NProgress from 'nprogress'

import {
  getToken, checkToken, removeToken,
} from '@/services/auth'

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
      path: '/login',
      name: 'login',
      component: () => import('@/views/login/Index.vue'),
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
          path: 'gallery/:id',
          name: 'manager-gallery-detail',
          component: () => import('@/views/manager/gallery/Detail.vue'),
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
  document.title = '遛猫网'
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    const token = getToken()
    if (token && checkToken(token)) {
      next()
    } else {
      removeToken()
      next({
        path: '/login',
        query: to.fullPath.indexOf('redirect') < 0 ? { redirect: to.fullPath } : {},
      })
    }
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
