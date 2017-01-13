class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  before_action :check_auth

  def check_auth
    if cookies[:user_cookie] != Digest::MD5.hexdigest(Settings.get('admin','password'))
      redirect_to '/user/login'
    end
  end
end
