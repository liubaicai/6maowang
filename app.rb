#encoding : UTF-8

require 'sinatra'
require 'sinatra/activerecord'
require './environments'
require 'sinatra/flash'
require 'sinatra/redirect_with_flash'
require 'sinatra/captcha'

enable :sessions


class Post < ActiveRecord::Base
  validates :title, presence: true, length: { minimum: 5 }
  validates :body, presence: true
end

class AppConfig < ActiveRecord::Base
  self.table_name = "configs"
end

helpers do
  def title
    if @title
      "#{@title}"
    else
      "welcome."
    end
  end
end

helpers do
  include Rack::Utils
  alias_method :h, :escape_html
end

# get ALL posts
get "/" do
  @posts = Post.order("created_at DESC")
  @title = "welcome."
  erb :"posts/index"
end

# view post
get "/posts/:id" do
  @post = Post.find(params[:id])
  @title = @post.title
  erb :"posts/view"
end

# check user
# get "/*" do
#   begin 
#   pwd = request.cookies['admin_password']
#   if Config.get('admin_password') == pwd
#     pass
#   else
#     halt 401.1
#   end
#   rescue Exception => e 
#     e.to_s
#   end
# end
# post "/*" do
#   begin 
#   pwd = request.cookies['admin_password']
#   if Config.get('admin_password') == pwd
#     pass
#   else
#     halt 401.1
#   end
#   rescue Exception => e 
#     e.to_s
#   end
# end

# create new post
get "/posts/create" do
  @title = "Create post"
  @post = Post.new
  erb :"posts/create"
end
post "/posts" do
  redirect "posts/create", :error => 'Invalid captcha' unless captcha_pass?
  @post = Post.new(params[:post])
  if @post.save
    redirect "posts/#{@post.id}", :notice => 'Congrats! Love the new post. (This message will disappear in 4 seconds.)'
  else
    redirect "posts/create", :error => 'Something went wrong. Try again. (This message will disappear in 4 seconds.)'
  end
end

# edit post
get "/posts/:id/edit" do
  @post = Post.find(params[:id])
  @title = "Edit Form"
  erb :"posts/edit"
end
put "/posts/:id" do
  @post = Post.find(params[:id])
  @post.update(params[:post])
  redirect "/posts/#{@post.id}"
end
