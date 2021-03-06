class UserController < ApplicationController
  skip_before_action :check_token, only: [:login]

  def login
    begin
      password = params[:password]
      if !password || password != Setting.find(1).password
        render json: Result.new(1000, 'password error', nil)
        return
      end
      payload = { 
        user: 'admin',
        expires_at: (Time.now + 1 * 86400).to_i
      }
      token = JWT.encode payload, @@hmac_secret, 'HS256'
      render json: Result.new(0, nil, token)
    rescue => exception
      render json: Result.new(1000, exception.message, nil)
    end
  end
end
