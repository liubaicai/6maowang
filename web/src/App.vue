<template>
  <el-container>
    <el-header height="48px">
      <div class="header flex">
        <div class="logo" @click="onLogoClick">
          <img src="@/assets/images/logo.png" />
        </div>
        <div class="title">遛猫网</div>
        <div class="flex1"></div>
        <div class="user" @click="onAvatarClick">
          <el-avatar size="small">
            <img src="@/assets/images/user.png" />
          </el-avatar>
        </div>
      </div>
    </el-header>
    <el-main style="margin-top:48px;">
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script>
export default {
  name: 'app',
  methods: {
    onLogoClick() {
      this.$router.push({ path: '/' })
    },
    onAvatarClick() {
      this.$router.push({ path: '/manager' })
    },
  },
}
</script>

<style lang="scss" scoped>
.el-header {
  width: 100%;
  padding: 0;
  position: fixed;
  z-index: 999;
}
.header {
  width: 100%;
  height: 100%;
  background-color: rgb(84, 92, 100);

  .logo {
    height: 60px;
    padding: 10px 10px 10px 20px;

    img {
      height: 28px;
    }
  }

  .title {
    font-size: 1.1rem;
    line-height: 48px;
    color: #eeeeee;
  }

  .user {
    padding: 10px;
  }
}
</style>
