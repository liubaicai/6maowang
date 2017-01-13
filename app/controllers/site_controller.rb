class SiteController < ApplicationController
  skip_before_action :check_auth, only: [:index, :detail]

  def index
    @galleries = Gallery.all
  end

  def detail
    @gallery = Gallery.find(params[:id])
  end

  def manager

  end

  def settings

  end

  def edit_settings
    Settings.set('admin','password',params[:password])
    Settings.set('aliyun','access_key_id',params[:access_key_id])
    Settings.set('aliyun','access_key_secret',params[:access_key_secret])
    Settings.set('aliyun','endpoint',params[:endpoint])
    Settings.save_config
    redirect_to :back
  end

end
