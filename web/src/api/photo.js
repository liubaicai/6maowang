import Base from '@/api/core/base'

class Photo extends Base {
    uploadUrl = () => `${this.baseUrl}/photos/upload`
}

const photo = new Photo('/photos')

export default photo
