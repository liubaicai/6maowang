<template>
  <div class="container-water-fall">
    <waterfall :col="col" :data="galleries" @loadmore="loadmore">
      <template>
        <div
          class="cell-item-base"
          v-for="(item,index) in galleries"
          :key="index"
          @click="onGalleryClick(item)"
        >
          <div class="cell-item">
            <img v-if="item.cover" :lazy-src="item.cover+'-view'" alt="加载错误" />
            <div class="item-body">
              <div class="item-title">{{item.title}}</div>
              <div class="flex1"></div>
              <div class="item-desc">
                <i class="el-icon-picture-outline"></i>
                {{item.photos_count}}
              </div>
            </div>
          </div>
        </div>
      </template>
    </waterfall>
  </div>
</template>

<script>
import galleryApi from '@/api/gallery'

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
      galleries: [],
      col: getWidth(),
      pager: {
        total: 0,
        per_page: 20,
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
        this.galleries.push(...result.data?.content)
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
    onGalleryClick(e) {
      this.$router.push({ name: 'gallery', params: { id: e.id } })
    },
  },
}
</script>
