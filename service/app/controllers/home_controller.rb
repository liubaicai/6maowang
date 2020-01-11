class HomeController < ApplicationController
  skip_before_action :check_token,:check_page, only: [:index]

  def index
    render plain: "HelloWorld!"
  end
end
