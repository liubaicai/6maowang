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

class SiteConfig < ActiveRecord::Base
  def self.login kkk
    sconfig = SiteConfig.where(:ckey => 'admin_password').first
    if sconfig.nil?
      return false
    elsif sconfig.cvalue == kkk
      return true
    else
      return false
    end
  end
  def self.password
    sconfig = SiteConfig.where(:ckey => 'admin_password').first
    return sconfig.cvalue
  end
end

helpers do
  def title
    if @title
      "#{@title}"
    else
      "遛猫网  啊~啊~啊~遛猫,你比捂猫多一猫,啊~啊~啊~遛猫,你比死猫多两猫."
    end
  end
end

helpers do
  include Rack::Utils
  alias_method :h, :escape_html
end

error do
  halt 500,env['sinatra.error'].message
end

# get ALL posts
get "/" do
  @posts = Post.order("created_at DESC")
  @title = "遛猫网  啊~啊~啊~遛猫,你比捂猫多一猫,啊~啊~啊~遛猫,你比死猫多两猫."
  erb :"posts/index"
end

# view post
get "/articles/:id" do
  @post = Post.find(params[:id])
  @title = @post.title
  erb :"posts/view"
end

# check user
get "/users/login" do
  @title = "Admin Login"
  erb :"users/login"
end
post "/users/login" do
	password = params[:password]
  if SiteConfig.login(password)
		session['admin_password'] = SiteConfig.password
    redirect to('/')
	else
    redirect to('/users/login')
	end
end

get "/posts*" do
  pwd = session['admin_password'].inspect
  if SiteConfig.login(pwd)
    pass
  else
    redirect to('/users/login')
  end
end
post "/posts*" do
  pwd = session['admin_password'].inspect
  if SiteConfig.login(pwd)
    pass
  else
    redirect to('/users/login')
  end
end

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
    redirect "articles/#{@post.id}", :notice => 'Congrats! Love the new post. (This message will disappear in 4 seconds.)'
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
  redirect "/articles/#{@post.id}"
end
