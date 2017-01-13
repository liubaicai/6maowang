class SiteController < ApplicationController
  skip_before_action :check_auth, only: [:index, :detail]

  def index
    @galleries = Gallery.all
  end

  def detail
    @gallery = Gallery.find(params[:id])
  end

  def manager

  end

  def settings

  end

  def edit_settings
    Settings.set('admin','password',params[:password])
    Settings.set('qiniu','access_key',params[:qn_access_key])
    Settings.set('qiniu','secret_key',params[:qn_secret_key])
    Settings.set('aliyun','access_key_id',params[:access_key_id])
    Settings.set('aliyun','access_key_secret',params[:access_key_secret])
    Settings.set('aliyun','endpoint',params[:endpoint])
    Settings.save_config
    redirect_to :back
  end

  def upload
    unless params[:fileup] && (tempfile = params[:fileup].tempfile)
      render plain: 'null'
    else
      begin
        Qiniu.establish_connection!(
            :access_key => Config.getValue('qn_ak'),
            :secret_key => Config.getValue('qn_sk'))
        base_qiniu_url = 'http://7xpagu.com1.z0.glb.clouddn.com/'
        #要上传的空间
        bucket = 'www-liubaicai-net'
        #上传到七牛后保存的文件名
        key = "images/"+Time.now.to_i.to_s+".jpg"
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
        render plain: base_qiniu_url + key
      rescue Exception => e
        render plain: e.message
      end
    end
  end
end
