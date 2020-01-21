import Base from '@/api/core/base'

class Photo extends Base {
    uploadToken = (data) => this.post('/photos/upload', data)
}

const photo = new Photo('/photos')

export default photo
