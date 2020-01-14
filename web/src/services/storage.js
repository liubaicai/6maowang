const base = window.localStorage
const sbase = window.sessionStorage

// 存储的相关方法

const storage = {
  set: (key, val, format = true) => {
    if (format) {
      return base.setItem(key, JSON.stringify(val))
    }
    return base.setItem(key, val)
  },

  get: (key, defaultVal, format = true) => {
    if (format) {
      return JSON.parse(base.getItem(key)) || defaultVal
    }
    return base.getItem(key) || defaultVal
  },

  remove: (key) => base.removeItem(key),

  claar: () => base.clear(),
}

const session = {
  set: (key, val, format = true) => {
    if (format) {
      return sbase.setItem(key, JSON.stringify(val))
    }
    return sbase.setItem(key, val)
  },

  get: (key, defaultVal, format = true) => {
    if (format) {
      return JSON.parse(sbase.getItem(key)) || defaultVal
    }
    return sbase.getItem(key) || defaultVal
  },

  remove: (key) => sbase.removeItem(key),

  claar: () => sbase.clear(),
}

export {
  storage,
  session,
}
