class ApplicationController < ActionController::API
  before_action :check_token, :check_page

  @@hmac_secret = ENV.fetch("RAILS_MASTER_KEY") { '6maowang$ecretK3y' }

  def check_token
    token = request.headers['Authorization']
    if !token
      render json: Result.new(403, 'authorization is null', nil)
      return
    end
    decoded_token = JWT.decode token, @@hmac_secret, true, { algorithm: 'HS256' }
    token_data = decoded_token[0]
    if token_data['user']!='admin'
      render json: Result.new(403, 'authorization error', nil)
      return
    end
    if token_data['expires_at'] < DateTime.now.to_i
      render json: Result.new(401, 'authorization expires', nil)
      return
    end
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
