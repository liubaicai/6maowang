import Base from '@/api/core/base'

class Setting extends Base {
    backup = () => this.get('/settings/backup')

    restoreUrl = () => `${this.baseUrl}/settings/backup`
}

const setting = new Setting('/settings')

export default setting
