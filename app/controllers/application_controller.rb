class ApplicationController < ActionController::API
  before_action :check_token, :check_page

  def check_token
    puts request.headers
  end

  def check_page
    if params[:page].nil?
      params[:page] = 1
    end
    if params[:per_page].nil?
      params[:per_page] = 10
    end
  end
end
