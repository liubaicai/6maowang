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
    border-radius: 6px;
    overflow: hidden;
    box-sizing: border-box;
    font-size: 1rem;
    line-height: 1.2rem;
    img {
      /* border-radius: 12px 12px 0 0; */
      width: 100%;
      height: auto;
      display: block;
    }
    .item-body {
      /* border: 1px solid #F0F0F0; */
      padding: 3px 12px;
      display: flex;

      .item-title {
        color: #333333;
        font-weight: bold;
      }
      .item-desc {
        color: #666666;
        font-weight: normal;
      }
      .item-exif {
        color: #999999;
        font-weight: normal;
        font-size: 0.8rem;
      }
      .item-download {
        color: #666666;
        font-weight: normal;
        font-size: 1rem;
        align-self: flex-end;
      }
    }
    .item-body:first-of-type {
      padding-top: 12px;
    }
    .item-body:last-of-type {
      padding-bottom: 12px;
    }
  }
}
</style>
