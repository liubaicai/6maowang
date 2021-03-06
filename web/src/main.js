import Vue from 'vue'
import ElementUI from 'element-ui'
import waterfall from 'vue-waterfall2'
import dayjs from 'dayjs'
import deepcopy from 'deepcopy'

import 'element-ui/lib/theme-chalk/index.css'

import App from './App.vue'
import router from '@/routers'

import '@/assets/styles/index.less'

Vue.use(ElementUI, { size: 'small', zIndex: 3000 })
Vue.use(waterfall)

Vue.config.productionTip = false

Vue.mixin({
  data() {
    return {
      pageLoading: true,
      saveLoading: false,
    }
  },
  methods: {
    isMobile() {
      // eslint-disable-next-line max-len
      const flag = navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)
      return flag
    },
  },
})

Vue.prototype.$dayjs = dayjs
Vue.prototype.$dcopy = deepcopy
Vue.prototype.$setTitle = (e) => {
  document.title = e
}

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app')
