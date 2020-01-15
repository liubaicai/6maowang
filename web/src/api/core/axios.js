import axios from 'axios'
import qs from 'qs'

import router from '@/routers'
import { getToken, removeToken, checkToken } from '@/services/auth'

axios.defaults.paramsSerializer = (params) => qs.stringify(params, {
  indices: false,
})

// create an axios instance
const service = axios.create({
  baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 30000, // request timeout
})

// request interceptor
service.interceptors.request.use(
  (config) => {
    const route = router.currentRoute
    if (!route.matched.some((record) => record.meta.requiresAuth)) {
      return config
    }
    const token = getToken()
    if (checkToken(token)) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = `${token}`
    } else {
      removeToken()
      const query = route.fullPath.indexOf('redirect') < 0 ? { redirect: route.fullPath } : {}
      router.replace({ path: '/login', query })
      const message = '登陆过期'
      return Promise.reject(message)
    }
    return config
  },
  (error) => {
    console.error(error)
    return Promise.reject(error)
  },
)

service.interceptors.response.use((res) => res)

export default service
