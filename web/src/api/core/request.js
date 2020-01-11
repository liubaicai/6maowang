import service from './axios'

const headers = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
}

const HTTPSuccessFn = (res) => res.data

const HandleServerError = (data) => {
  if (data.code !== 0) {
    console.warn(data.message)
    return Promise.reject(data.message)
  }
  return data
}

const HTTPFailedFn = (err) => {
  console.error(err)
  return Promise.reject(err)
}

const request = (options) => {
  const t = {
    url: options.url,
    method: options.method,
    params: options.params,
    data: options.data,
    headers: Object.assign(headers, options.headers),
    responseType: options.responseType,
  }
  return service(t)
    .then(HTTPSuccessFn)
    .then(HandleServerError)
    .catch(HTTPFailedFn)
}

export default request
