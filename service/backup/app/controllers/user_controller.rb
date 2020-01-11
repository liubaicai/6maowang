class UserController < ApplicationController
  skip_before_action :check_auth, only: [:login, :post_login]

  def login
  end

  def logout
    cookies.delete :user_cookie
    redirect_to '/'
  end

  def post_login
    password = params[:password]
    if Digest::MD5.hexdigest(password) == Digest::MD5.hexdigest(Settings.get('admin','password'))
      cookies[:user_cookie] = { :value => Digest::MD5.hexdigest(password) , :expires => 1.month.from_now }
      redirect_to '/'
    else
      cookies.delete :user_cookie
      render 'login'
    end
  end

end
