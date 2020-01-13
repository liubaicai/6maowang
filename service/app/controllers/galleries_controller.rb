class GalleriesController < ApplicationController
  before_action :check_page, only: [:index]
  before_action :set_gallery, only: [:show, :edit, :update, :destroy]
  skip_before_action :check_token, only: [:index, :show]

  def index
    galleries = Gallery.order("updated_at DESC").page(params[:page]).per(params[:per_page])
    page = Page.new(galleries, params[:page], params[:per_page], galleries.total_count)
    result = Result.new(0, nil, page)
    render json: result.to_json(methods: :photos_count)
  end

  def show
    result = Result.new(0, nil, @gallery)
    render json: result
  end

  def new
  end

  def edit
  end

  def create
    @gallery = Gallery.new(gallery_params)
    if @gallery.save
      render json: Result.new(0, nil, @gallery)
    else
      render json: Result.new(422, @gallery.errors, nil)
    end
  end

  def update
    if @gallery.update(gallery_params)
      render json: Result.new(0, nil, @gallery)
    else
      render json: Result.new(422, @gallery.errors, nil)
    end
  end

  def destroy
    @gallery.destroy
    render json: Result.new(0, nil, nil)
  end

  private

  def set_gallery
    @gallery = Gallery.find(params[:id])
  end

  def gallery_params
    params.require(:gallery).permit(:title, :cover, :description)
  end
end
