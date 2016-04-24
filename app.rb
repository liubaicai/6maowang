#encoding : UTF-8

require 'sinatra'
require 'sinatra/activerecord'
require './environments'
require 'sinatra/flash'
require 'sinatra/redirect_with_flash'
require 'sinatra/captcha'
require 'qiniu'
require 'nokogiri'


class Post < ActiveRecord::Base
  validates :title, presence: true, length: { minimum: 5 }
  validates :body, presence: true

  def imgs
    doc = Nokogiri::HTML(body)
    img_srcs = doc.css('img').map{ |i| i['src'] }
    img_srcs
  end
end

class SiteConfig < ActiveRecord::Base

  def self.get_password
    SiteConfig.where(:ckey => "admin_password").first.cvalue
  end

  def self.get_value ck
    SiteConfig.where(:ckey => ck).first.cvalue
  end
  
end

use Rack::Session::Pool, :expire_after => 2592000
$page_size = 8

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

after do
    ActiveRecord::Base.connection.close
end

$base_qiniu_url = "http://7xov7e.com1.z0.glb.clouddn.com/"
# 构建鉴权对象
Qiniu.establish_connection! :access_key => SiteConfig.get_value('qiniu_ak'),
                            :secret_key => SiteConfig.get_value('qiniu_sk')

####################################################################################################
####################################################################################################
####################################################################################################
####################################################################################################
####################################################################################################

# get posts list
get "/" do
  @posts = Post.order("created_at DESC").limit($page_size)
  @title = "遛猫网  啊~啊~啊~遛猫,你比捂猫多一猫,啊~啊~啊~遛猫,你比死猫多两猫."
  t_count = Post.count
  @pre_no = ""
  @pre_class = "class=\"disabled\""
  if t_count > $page_size
    @nxt_no = "href=\"/page/2\""
    @nxt_class = ""
  else
    @nxt_no = ""
    @nxt_class = "class=\"disabled\""
  end
  erb :"posts/index"
end
get %r{/page/([\d]+)} do |page_no|
  page_no = page_no.to_i
  @posts = Post.order("created_at DESC").limit($page_size).offset($page_size*(page_no-1))
  @title = "遛猫网  啊~啊~啊~遛猫,你比捂猫多一猫,啊~啊~啊~遛猫,你比死猫多两猫."
  t_count = Post.count
  if page_no == 1 && t_count > $page_size
    @pre_no = ""
    @pre_class = "class=\"disabled\""
    @nxt_no = "href=\"/page/2\""
    @nxt_class = ""
  elsif page_no == 1 && t_count <= $page_size
    @pre_no = ""
    @pre_class = "class=\"disabled\""
    @nxt_no = ""
    @nxt_class = "class=\"disabled\""
  elsif page_no > 1 && t_count < $page_size*page_no
    @pre_no = "href=\"/page/#{page_no-1}\""
    @pre_class = ""
    @nxt_no = ""
    @nxt_class = "class=\"disabled\""
  elsif page_no > 1 && t_count > $page_size*page_no
    @pre_no = "href=\"/page/#{page_no-1}\""
    @pre_class = ""
    @nxt_no = "href=\"/page/#{page_no+1}\""
    @nxt_class = ""
  end
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
  @title = "admin login"
  if request["refer"].nil?
    @query_string = '?refer='+ERB::Util.url_encode(request.referrer)
  else
    @query_string = '?refer='+request["refer"]
  end
  erb :"users/login"
end
post "/users/login" do
	password = params[:password]
  refer = request["refer"]
  if SiteConfig.get_password == password
		session['admin_password'] = password
    if refer.nil?
      redirect to('/')
    else
      redirect to(refer)
    end
	else
    redirect to('/users/login')
	end
end
get "/posts*" do
  pwd = session['admin_password']
  if pwd == SiteConfig.get_password
    pass
  else
    redirect to('/users/login?refer='+ERB::Util.url_encode(request.url))
  end
end
post "/posts*" do
  pwd = session['admin_password']
  if pwd == SiteConfig.get_password
    pass
  else
    redirect to('/users/login?refer='+ERB::Util.url_encode(request.url))
  end
end

# create new post
get "/posts/create" do
  @title = "Create post"
  @post = Post.new
  erb :"posts/create"
end
post "/posts" do
  # redirect "posts/create", :error => 'Invalid captcha' unless captcha_pass?
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

# delete post
get "/posts/:id/delete" do
  post = Post.find(params[:id])
  post.destroy
  redirect to('/')
end

# upload image
post "/image/upload" do
  unless params[:fileup] && (tempfile = params[:fileup][:tempfile])
    "NULL"
  end
  begin 
    #要上传的空间
    bucket = "www-6mao-wang"
    #上传到七牛后保存的文件名
    key = "upload/"+Time.now.to_i.to_s+".jpg"
    #构建上传策略
    put_policy = Qiniu::Auth::PutPolicy.new(
      bucket,      # 存储空间
      key,     # 最终资源名，可省略，即缺省为“创建”语义，设置为nil为普通上传 
      3600    #token过期时间，默认为3600s
    )
    #生成上传 Token
    uptoken = Qiniu::Auth.generate_uptoken(put_policy)
    #要上传文件的本地路径
    #filePath = tempfile.path
    #调用upload_with_token_2方法上传
    code, result, response_headers = Qiniu::Storage.upload_with_token_2(
        uptoken, 
        tempfile,
        key
    )
    $base_qiniu_url + key
  rescue Exception => e 
    e.message
  end
end