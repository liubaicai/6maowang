class ApplicationController < ActionController::API
    before_action :check_auth

    def check_auth
        puts request.headers
    end
end
