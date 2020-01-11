class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  before_action :check_auth

  def render_404
    # user = User.find_by_email(params[:email]) or raise("not found")
    respond_to do |format|
      format.html { render :file => "#{Rails.root}/public/404.html", :layout => false, :status => :not_found }
      format.json  { head :not_found }
      format.any  { head :not_found }
    end
  end

  def check_auth
    if cookies[:user_cookie] != Digest::MD5.hexdigest(Settings.get('admin','password'))
      redirect_to '/user/login'
    end
  end
end
