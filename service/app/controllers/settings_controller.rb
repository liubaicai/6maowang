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

    def backup
        galleries = Gallery.order("updated_at ASC")
        photos = Photo.order("updated_at ASC")
        setting = Setting.find(1)
        result = Result.new(0, nil, Hash[
            :galleries => galleries,
            :photos => photos,
            :setting => setting])
        render json: result
    end

    def restore
        if params[:file] && (tempfile = params[:file].tempfile)
            content = JSON.parse(File.read(tempfile))
            galleries = content['galleries']
            photos = content['photos']
            setting = content['setting']
            Gallery.import galleries, on_duplicate_key_update: :all
            Photo.import photos, on_duplicate_key_update: :all
            Setting.update(setting)
            render json: Result.new(0, nil, nil)
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
