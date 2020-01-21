class SettingsController < ApplicationController
    before_action :set_setting, only: [:show, :update]

    def show
        result = Result.new(0, nil, @setting)
        render json: result
    end
    
    def update
        if @setting.update(setting_params)
            render json: Result.new(0, nil, @setting)
        else
            render json: Result.new(2000, @setting.errors, nil)
        end
    end

    private

    def set_setting
        @setting = Setting.find(1)
    end

    def setting_params
      params.require(:setting).permit(
          :password, 
          :qiniu_base_url, 
          :qiniu_access_key, 
          :qiniu_secret_key
        )
    end
end
