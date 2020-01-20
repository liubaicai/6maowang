class PhotosController < ApplicationController
  before_action :check_page, only: [:index]
  before_action :set_photo, only: [:show, :edit, :update, :destroy]
  before_action :get_gallery, only: [:index, :create]
  skip_before_action :check_token, only: [:index, :show]

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
    result = Result.new(0, nil, nil)
    render json: result
  end

  def new
  end

  def edit
  end

  def create
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
    params.require(:photo).permit(:title, :url, :description, :exif)
  end
end
