import axios from 'axios'
import qs from 'qs'

axios.defaults.paramsSerializer = (params) => qs.stringify(params, {
  indices: false,
})

// create an axios instance
const service = axios.create({
  baseURL: '/api', // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 30000, // request timeout
})

// request interceptor
service.interceptors.request.use(
  (config) => config,
  (error) => {
    console.error(error)
    return Promise.reject(error)
  },
)

service.interceptors.response.use((res) => res)

export default service
