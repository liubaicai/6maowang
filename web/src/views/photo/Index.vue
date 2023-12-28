<template>
  <div class="container-water-fall">
    <waterfall :col="col" :data="photos" @loadmore="loadmore">
      <template>
        <div class="cell-item-base" v-for="(item,index) in photos" :key="index">
          <div class="cell-item">
            <img v-if="item.url" :lazy-src="item.url+'-view8'" alt="加载错误" />
            <div class="item-body">
              <div class="item-desc">{{item.title}}</div>
            </div>
            <div class="item-body">
              <div class="item-exif">{{item.exif}}</div>
              <div class="flex1"></div>
              <div class="item-download">
                <el-button type="text" @click="download(item.url,item.title)">
                  <i class="el-icon-download"></i>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </waterfall>
  </div>
</template>

<script>
import photoApi from '@/api/photo'
import galleryApi from '@/api/gallery'
import downloader from '@/api/core/downloader'

function getWidth() {
  // eslint-disable-next-line max-len
  if (navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)) {
    return 1
  }
  if (window.innerWidth > 1600) {
    return 5
  }
  if (window.innerWidth > 1200) {
    return 4
  }
  if (window.innerWidth > 800) {
    return 3
  }
  if (window.innerWidth > 400) {
    return 2
  }
  return 1
}

export default {
  data() {
    return {
      gallery_id: null,
      gallery: null,
      photos: [],
      col: getWidth(),
      pager: {
        total: 0,
        per_page: 20,
        page: 1,
      },
    }
  },
  created() {
    this.gallery_id = this.$route.params.id
  },
  mounted() {
    this.photos = []
    this.getData(1)
    galleryApi.detail(this.gallery_id).then((result) => {
      this.gallery = result.data
      this.$setTitle(result.data?.title)
    })
  },
  methods: {
    getData(page) {
      if (page) {
        this.pager.page = page
      }
      const body = Object.assign(this.pager, {
        gallery_id: this.gallery_id,
      })
      photoApi.list(body).then((result) => {
        this.photos.push(...result.data?.content)
        this.pager.total = result.data?.total
      })
    },
    loadmore() {
      const { pager } = this
      const totalPage = Math.ceil(pager.total / pager.per_page)
      if (pager.page < totalPage) {
        pager.page += 1
        this.getData()
      }
    },
    async download(url, filename) {
      const config = {
        url,
        method: 'get',
      }
      await downloader(config, filename)
    },
  },
}
</script>
