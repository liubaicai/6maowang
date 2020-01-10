class HomeController < ApplicationController
  def index
    render plain: 'helloworld'
  end
end
