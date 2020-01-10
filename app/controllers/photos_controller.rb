class PhotosController < ApplicationController
  before_action :set_photo, only: [:show, :edit, :update, :destroy]
  before_action :get_gallery, only: [:index, :create]

  def index
    photos= Photo.where(gallery_id:@gallery_id).order("updated_at DESC").page(params[:page]).per(params[:per_page])
    page = Page.new(photos, params[:page], params[:per_page], photos.total_count)
    result = Result.new(0, nil, page)
    render json: result
  end

  def show
    result = Result.new(0, nil, @photo)
    render json: result
  end

  def new
  end

  def edit
  end

  def create
  end

  def update
  end

  def destroy
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
