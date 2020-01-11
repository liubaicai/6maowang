import Vue from 'vue'
import ElementUI from 'element-ui'
import waterfall from 'vue-waterfall2'

import 'element-ui/lib/theme-chalk/index.css'

import App from './App.vue'
import router from '@/routers'

Vue.use(ElementUI)
Vue.use(waterfall)

Vue.config.productionTip = false

new Vue({
  router,
  render: (h) => h(App),
}).$mount('#app')
