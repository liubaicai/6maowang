import { storage } from './storage'

// 操作token

const STORAGE_KEY = 'auth_token'

export function getToken() {
  return storage.get(STORAGE_KEY, null, false)
}

export function setToken(token) {
  return storage.set(STORAGE_KEY, token, false)
}

export function removeToken() {
  return storage.remove(STORAGE_KEY)
}

export function checkToken(token) {
  if (token) {
    if (token.split('.')) {
      const decodedData = JSON.parse(window.atob(token.split('.')[1]))
      const ext = parseInt(decodedData.exp, 10)
      const now = Math.floor(new Date().getTime() / 1000)
      if (ext < now) {
        return false
      }
      return true
    }
  }
  return false
}
