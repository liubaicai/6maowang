import request from '@/api/core/request'
import downloader from '@/api/core/downloader'

// 一些基本的http方法和restful定义方法
class Base {
  constructor(rootPoint) {
    this.rootPoint = rootPoint
    this.baseUrl = process.env.VUE_APP_BASE_API
    this.request = request
    this.downloader = downloader
  }

  get = (url, params = {}, headers) => this.request({
    url,
    method: 'get',
    params,
    headers,
  })

  post = (url, data, headers) => this.request({
    url,
    method: 'post',
    data,
    headers,
  })

  put = (url, data, headers) => this.request({
    url,
    method: 'put',
    data,
    headers,
  })

  list = (params = {}) => this.request({
    url: this.rootPoint,
    method: 'get',
    params,
  })

  create = (data) => this.request({
    url: this.rootPoint,
    method: 'post',
    data,
  })

  detail = (id) => this.request({
    url: `${this.rootPoint}/${id}`,
    method: 'get',
  })

  edit = (id, data) => this.request({
    url: `${this.rootPoint}/${id}`,
    method: 'put',
    data,
  })

  delete = (id) => this.request({
    url: `${this.rootPoint}/${id}`,
    method: 'delete',
  })
}

export default Base
