<template>
  <el-container>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script>
export default {
  name: 'app',
}
</script>

<style lang="scss">
.flex {
  display: flex;
}
.flex1 {
  flex: 1;
}
</style>

<style lang="scss">
.container-water-fall {
  /* padding: 0 28px; */
  //   width: 100vw;
  box-sizing: border-box;

  .cell-item-base {
    padding: 0 6px 6px 6px;
  }

  .cell-item {
    width: 100%;
    /* margin-bottom: 18px; */
    background: #ffffff;
    border: 2px solid #f0f0f0;
    border-radius: 12px 12px 12px 12px;
    overflow: hidden;
    box-sizing: border-box;
    img {
      /* border-radius: 12px 12px 0 0; */
      width: 100%;
      height: auto;
      display: block;
    }
    .item-body {
      /* border: 1px solid #F0F0F0; */
      padding: 12px;
      display: flex;

      .item-desc {
        font-size: 15px;
        color: #333333;
        line-height: 15px;
        font-weight: bold;
      }
      .item-link {
        font-size: 15px;
        color: #666666;
        line-height: 15px;
        font-weight: normal;
      }
    }
  }
}
</style>
