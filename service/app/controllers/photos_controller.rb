class PhotosController < ApplicationController
  before_action :check_page, only: [:index, :np]
  before_action :set_photo, only: [:show, :edit, :update, :destroy]
  before_action :get_gallery, only: [:index, :create]
  skip_before_action :check_token, only: [:index, :show, :np]

  def np 
    photos= Photo.all().order("updated_at DESC").page(params[:page]).per(params[:per_page])
    page = Page.new(photos, params[:page].to_i, params[:per_page].to_i, photos.total_count)
    result = Result.new(0, nil, page)
    render json: result
  end

  def index
    photos= Photo.where(gallery_id:@gallery_id).order("updated_at DESC").page(params[:page]).per(params[:per_page])
    page = Page.new(photos, params[:page].to_i, params[:per_page].to_i, photos.total_count)
    result = Result.new(0, nil, page)
    render json: result
  end

  def show
    result = Result.new(0, nil, @photo)
    render json: result
  end

  def upload
    base_url = Setting.find(1).qiniu_base_url
    access_key = Setting.find(1).qiniu_access_key
    secret_key = Setting.find(1).qiniu_secret_key
    Qiniu.establish_connection! :access_key => access_key,
                                :secret_key => secret_key
    bucket = 'www-6mao-wang'
    key = "photos/#{Time.now.to_i}-#{params[:name]}"
    put_policy = Qiniu::Auth::PutPolicy.new(
        bucket,
        key,
        3600
    )
    uptoken = Qiniu::Auth.generate_uptoken(put_policy)

    data = Hash[:token => uptoken, :key => key, :base_url => base_url]
    result = Result.new(0, nil, data)
    render json: result
  end

  def new
  end

  def edit
  end

  def create
    @photo = Photo.new(photo_params)
    if @photo.save
      render json: Result.new(0, nil, @photo)
    else
      render json: Result.new(2000, @photo.errors, nil)
    end
  end

  def update
    if @photo.update(photo_params)
      render json: Result.new(0, nil, @photo)
    else
      render json: Result.new(2000, @photo.errors, nil)
    end
  end

  def destroy
    @photo.destroy
    render json: Result.new(0, nil, nil)
  end

  private

  def get_gallery
    @gallery_id = params[:gallery_id]
  end

  def set_photo
    @photo = Photo.find(params[:id])
  end

  def photo_params
    params.require(:photo).permit(:title, :url, :description, :exif, :gallery_id)
  end
end
