import Base from '@/api/core/base'

class User extends Base {
    login = (data) => this.post('/user/login', data)
}

const user = new User()

export default user
