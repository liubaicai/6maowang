<template>
  <div>
    <el-page-header @back="$router.back()">
      <div slot="content" class="page-header">
        <span class="header-title">{{gallery.title}}</span>
        <span class="header-subtitle">{{gallery.description}}</span>
      </div>
    </el-page-header>
    <div class="header-area" style="margin-top:20px;">
      <el-button icon="el-icon-edit" @click="onEditGallery">编辑</el-button>
      <el-button icon="el-icon-upload2" @click="onNewPhoto">上传</el-button>
    </div>
    <div class="body-area">
      <el-table :data="photos" v-loading="pageLoading" border stripe style="width: 100%">
        <el-table-column label="标题">
          <template slot-scope="scope">
            <template v-if="scope.row.editing">
              <el-input v-model="scope.row.title"></el-input>
            </template>
            <template v-else>{{scope.row.title}}</template>
          </template>
        </el-table-column>
        <el-table-column label="描述">
          <template slot-scope="scope">
            <template v-if="scope.row.editing">
              <el-input v-model="scope.row.description"></el-input>
            </template>
            <template v-else>{{scope.row.description}}</template>
          </template>
        </el-table-column>
        <el-table-column label="地址" width="85">
          <template slot-scope="scope">
            <div class="cover-view" :style="{'background-image': `url(${scope.row.url}-view)`}">
              <el-popover v-if="scope.row.url" placement="right-start" trigger="hover">
                <img :src="scope.row.url+'-view'" style="max-height:200px;max-width:200px;" />
                <el-button
                  type="text"
                  slot="reference"
                  icon="el-icon-picture-outline"
                  class="cover-button"
                  @click="windowOpen(scope.row.url)"
                >预览</el-button>
              </el-popover>
            </div>
          </template>
        </el-table-column>
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
        <el-table-column fixed="right" label="操作" width="145">
          <template slot-scope="scope">
            <template v-if="scope.row.editing">
              <el-button @click="onEditPhotoSave(scope.row)" type="text" size="small">保存</el-button>
              <el-button @click="onEditPhotoCancel(scope.row)" type="text" size="small">取消</el-button>
            </template>
            <template v-else>
              <el-button @click="onEditPhoto(scope.row)" type="text" size="small">编辑</el-button>
              <el-button
                @click="onEditGalleryCover(scope.row)"
                type="text"
                size="small"
                :disabled="scope.row.url===gallery.cover"
              >设为封面</el-button>
              <el-button @click="onDeletePhoto(scope.row)" type="text" size="small">删除</el-button>
            </template>
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
    <el-dialog title="编辑" :visible.sync="editGalleryVisible" :close-on-click-modal="false">
      <el-form :model="galleryClone">
        <el-form-item label="标题">
          <el-input v-model="galleryClone.title" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="galleryClone.description" type="textarea" :rows="3" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="editGalleryVisible = false">取消</el-button>
        <el-button type="primary" @click="onEditGallerySave" :loading="saveLoading">确定</el-button>
      </div>
    </el-dialog>
    <el-dialog :visible.sync="uploadPhotoVisible" :close-on-click-modal="false">
      <div>
        <el-upload
          class="photo-uploader"
          ref="upload"
          action="#"
          list-type="picture-card"
          drag
          multiple
          :auto-upload="false"
          :http-request="uploadRequest"
        >
          <i class="el-icon-plus"></i>
        </el-upload>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="onUploadPhotoCancel">关闭</el-button>
        <el-button type="primary" @click="onUploadPhotoSave">开始上传</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'
import * as qiniu from 'qiniu-js'
import galleryApi from '@/api/gallery'
import photoApi from '@/api/photo'

export default {
  data() {
    return {
      editGalleryVisible: false,
      uploadPhotoVisible: false,
      gallery_id: null,
      gallery: {},
      galleryClone: {},
      photoClone: {},
      photos: [],
      pager: {
        total: 0,
        per_page: 10,
        page: 1,
      },
    }
  },
  created() {
    this.gallery_id = this.$route.params.id
    galleryApi.detail(this.gallery_id).then((result) => {
      this.gallery = result.data
    })
  },
  mounted() {
    this.photos = []
    this.getData(1)
  },
  methods: {
    getData(page) {
      this.pageLoading = true
      if (page) {
        this.pager.page = page
      }
      const body = Object.assign(this.pager, {
        gallery_id: this.gallery_id,
      })
      photoApi
        .list(body)
        .then((result) => {
          this.photos = result.data?.content
          this.pager.total = result.data?.total
        })
        .finally(() => {
          this.pageLoading = false
        })
    },
    handleCurrentChange(val) {
      this.getData(val)
    },
    windowOpen(url) {
      window.open(url, '_blank')
    },
    onCopyUrlSuccess() {
      this.$message({
        message: '复制成功！',
        type: 'success',
      })
    },
    onEditGallery() {
      this.galleryClone = this.$dcopy(this.gallery)
      this.editGalleryVisible = true
    },
    onEditGallerySave() {
      this.saveLoading = true
      galleryApi
        .edit(this.gallery_id, this.galleryClone)
        .then((result) => {
          this.gallery = result.data
          this.editGalleryVisible = false
        })
        .finally(() => {
          this.saveLoading = false
        })
    },
    onEditGalleryCover(e) {
      galleryApi
        .edit(this.gallery_id, {
          cover: e.url,
        })
        .then((result) => {
          this.gallery = result.data
        })
    },
    onNewPhoto() {
      this.uploadPhotoVisible = true
    },
    onEditPhoto(e) {
      this.photoClone[e.id] = this.$dcopy(e)
      this.$set(e, 'editing', true)
    },
    onEditPhotoSave(e) {
      const index = this.photos.indexOf(e)
      photoApi
        .edit(e.id, e)
        .then((result) => {
          const t = result
          t.data.editing = false
          this.$set(this.photos, index, t.data)
        })
        .catch(() => {
          this.$set(e, 'editing', false)
        })
    },
    onEditPhotoCancel(e) {
      const index = this.photos.indexOf(e)
      this.photoClone[e.id].editing = false
      this.$set(this.photos, index, this.photoClone[e.id])
    },
    onDeletePhoto(e) {
      this.$confirm('确定要删除?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        photoApi.delete(e.id).then(() => {
          this.getData()
        })
      })
    },
    onUploadPhotoCancel() {
      this.$refs.upload.abort()
      this.$refs.upload.clearFiles()
      this.uploadPhotoVisible = false
    },
    onUploadPhotoSave() {
      this.$refs.upload.submit()
    },
    async uploadRequest(e) {
      const that = this
      const tokenResult = (
        await photoApi.uploadToken({
          name: e.file.name,
        })
      ).data
      const putExtra = {
        fname: e.file.name,
        params: {},
        mimeType: null,
      }
      const config = {
        useCdnDomain: true,
      }
      const { key } = tokenResult
      const { token } = tokenResult
      const { base_url } = tokenResult
      const observable = qiniu.upload(e.file, key, token, putExtra, config)
      const promise = new Promise((resolve, reject) => {
        observable.subscribe({
          next(res) {
            e.file.percent = res.total.percent
            e.onProgress(e.file)
          },
          error(err) {
            reject(err)
            e.onError(err)
            this.$message({
              message: err.message || err,
              type: 'error',
            })
          },
          async complete(res) {
            const objKey = res.key
            const url = `${base_url}${objKey}`
            const exif = await that.getExif()
            const body = {
              title: e.file.name,
              url,
              description: '',
              exif,
              gallery_id: that.gallery_id,
            }
            photoApi
              .create(body)
              .then((result) => {
                that.photos.unshift(result.data)
                if (that.photos.length > that.pager.per_page) {
                  that.photos.pop()
                }
                resolve(e.file)
                e.onSuccess(e.file)
              })
              .catch((err) => {
                reject(err)
                e.onError(err)
              })
          },
        })
      })
      await promise
    },
    async getExif(url) {
      const promise = new Promise((resolve) => {
        axios
          .get(`${url}?exif`)
          .then((result) => {
            const exifObj = result.data
            const make = exifObj?.Make?.val || ''
            const model = exifObj?.Model?.val || ''
            const flength = exifObj?.FocalLength?.val || ''
            const fnumber = exifObj?.FNumber?.val || ''
            const etime = exifObj?.ExposureTime?.val || ''
            const iso = exifObj?.ISOSpeedRatings?.val || ''
            const exif = `${make} ${model}; ${flength}; ${fnumber}; ${etime}; iso${iso};`
            resolve(exif)
          })
          .catch(() => {
            resolve('')
          })
      })
      return promise
    },
  },
}
</script>

<style lang="less" scoped>
.page-header {
  display: flex;

  .header-title {
    margin-right: 10px;
  }
  .header-subtitle {
    color: #999999;
    line-height: 18px;
    font-size: 14px;
    align-self: flex-end;
  }
}
</style>
