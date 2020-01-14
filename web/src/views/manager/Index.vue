<template>
  <el-container>
    <el-aside width="200px" class="aside">
      <el-menu
        :default-active="defaultActive"
        background-color="#545c64"
        text-color="#fff"
        active-text-color="#ffd04b"
        :router="true"
      >
        <el-menu-item index="/manager/gallery">
          <i class="el-icon-menu"></i>
          <span slot="title">相册管理</span>
        </el-menu-item>
        <el-menu-item index="/manager/settings">
          <i class="el-icon-menu"></i>
          <span slot="title">系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <div class="manager-container">
        <div class="manager-body">
          <router-view></router-view>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script>
export default {
  computed: {
    defaultActive() {
      const r = this.$route.path
      return r
    },
  },
}
</script>

<style lang="scss" scoped>
.aside {
  background-color: #545c64;
  min-height: calc(100vh - 48px);
  padding-top: 24px;
}
</style>
