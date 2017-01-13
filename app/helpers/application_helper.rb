module ApplicationHelper

  def has_auth
    if cookies[:user_cookie] == Digest::MD5.hexdigest(Settings.get('admin','password'))
      return true
    else
      return false
    end
  end

end
