<template>
  <div>
    <h3>数据备份和还原</h3>
    <div class="header-area">
      <el-button icon="el-icon-upload2">还原</el-button>
      <el-button icon="el-icon-download">备份</el-button>
    </div>
    <el-divider></el-divider>
    <h3>七牛云密钥管理</h3>
    <div class="header-area">
      <el-input class="header-input" v-model="qiniu.base_url" placeholder="base_url" />
      <el-input class="header-input" v-model="qiniu.access_key" placeholder="access_key" />
      <el-input class="header-input" v-model="qiniu.secret_key" placeholder="secret_key" />
      <el-button icon="el-icon-document-copy" @click="saveQiniu">保存</el-button>
    </div>
    <el-divider></el-divider>
    <h3>密码管理</h3>
    <div class="header-area">
      <el-input class="header-input" type="password" v-model="password" placeholder="密码" />
      <el-button icon="el-icon-document-copy" @click="savePassword">保存</el-button>
    </div>
    <el-divider></el-divider>
    <div class="header-area">
      <el-button icon="el-icon-circle-close" @click="onLogout">退出登录</el-button>
    </div>
  </div>
</template>

<script>
import settingApi from '@/api/setting'
import { removeToken } from '@/services/auth'

export default {
  data() {
    return {
      qiniu: {
        base_url: '',
        access_key: '',
        secret_key: '',
      },
      password: '',
    }
  },
  created() {
    settingApi.detail(1).then((result) => {
      this.password = result.data?.password
      this.qiniu.base_url = result.data?.qiniu_base_url || ''
      this.qiniu.access_key = result.data?.qiniu_access_key || ''
      this.qiniu.secret_key = result.data?.qiniu_secret_key || ''
    })
  },
  methods: {
    onLogout() {
      removeToken()
      this.$router.push({
        path: '/login',
      })
    },
    saveQiniu() {
      settingApi
        .edit(1, {
          qiniu_base_url: this.qiniu.base_url,
          qiniu_access_key: this.qiniu.access_key,
          qiniu_secret_key: this.qiniu.secret_key,
        })
        .then(() => {
          this.$message({
            message: '设置成功！',
            type: 'success',
          })
        })
    },
    savePassword() {
      settingApi
        .edit(1, {
          password: this.password,
        })
        .then(() => {
          this.$message({
            message: '设置成功！',
            type: 'success',
          })
          setTimeout(() => {
            this.onLogout()
          }, 1000)
        })
    },
  },
}
</script>

<style>
</style>
