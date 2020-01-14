<template>
  <div>
    <div class="header-area">
      <el-button icon="el-icon-plus">新建</el-button>
    </div>
    <div class="body-area">
      <el-table :data="galleries" border stripe style="width: 100%">
        <el-table-column prop="title" label="标题"></el-table-column>
        <el-table-column label="封面" width="85">
          <template slot-scope="scope">
            <el-popover placement="top-start" trigger="hover">
              <img :src="scope.row.cover+'-view'" style="max-height:200px;max-width:200px;" />
              <i slot="reference" class="el-icon-picture-outline"></i>
            </el-popover>
          </template>
        </el-table-column>
        <el-table-column prop="photos_count" label="图片数" width="85"></el-table-column>
        <el-table-column label="创建时间">
          <template
            slot-scope="scope"
          >{{$dayjs(scope.row.created_at).format('YYYY-MM-DD HH:mm:ss')}}</template>
        </el-table-column>
        <el-table-column label="更新时间">
          <template
            slot-scope="scope"
          >{{$dayjs(scope.row.updated_at).format('YYYY-MM-DD HH:mm:ss')}}</template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="85">
          <template slot-scope="scope">
            <el-button @click="handleClick(scope.row)" type="text" size="small">管理</el-button>
            <el-button type="text" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="footer-area">
      <el-pagination
        hide-on-single-page
        background
        @current-change="handleCurrentChange"
        :current-page="pager.page"
        :page-size="pager.per_page"
        layout="total, prev, pager, next"
        :total="pager.total"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import galleryApi from '@/api/gallery'

export default {
  data() {
    return {
      galleries: [],
      pager: {
        total: 0,
        per_page: 10,
        page: 1,
      },
    }
  },
  mounted() {
    this.galleries = []
    this.getData(1)
  },
  methods: {
    getData(page) {
      if (page) {
        this.pager.page = page
      }
      galleryApi.list(this.pager).then((result) => {
        this.galleries = result.data?.content
        this.pager.total = result.data?.total
      })
    },
    handleCurrentChange(val) {
      this.getData(val)
    },
  },
}
</script>

<style>
</style>
