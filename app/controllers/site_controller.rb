class SiteController < ApplicationController
  skip_before_action :check_auth, only: [:index, :detail]

  def index
    @galleries = Gallery.all.order('updated_at desc')
  end

  def detail
    @gallery = Gallery.where(:id => params[:id]).first
    if @gallery.nil?
      render_404
      # redirect_to '/'
    end
  end

  def manager

  end

  def settings

  end

  def edit_settings
    Settings.set('admin','password',params[:password])
    Settings.set('qiniu','base_url',params[:qn_base_url])
    Settings.set('qiniu','access_key',params[:qn_access_key])
    Settings.set('qiniu','secret_key',params[:qn_secret_key])
    Settings.set('aliyun','access_key_id',params[:access_key_id])
    Settings.set('aliyun','access_key_secret',params[:access_key_secret])
    Settings.set('aliyun','endpoint',params[:endpoint])
    Settings.save_config
    redirect_to :back
  end

  def update_description
    begin
      id = params[:'id']
      description = params[:'description']
      photo = Photo.find(id)
      photo.description = description
      photo.save
      render plain: 'Success'
    rescue Exception => e
      render plain: e
    end
  end

  def upload
    unless params[:file] && (tempfile = params[:file].tempfile)
      raise Exception
    else
      begin
        $base_qiniu_url = Settings.get('qiniu','base_url')
        # 构建鉴权对象
        Qiniu.establish_connection! :access_key => Settings.get('qiniu','access_key'),
                                    :secret_key => Settings.get('qiniu','secret_key')

        exif_obj = EXIFR::JPEG.new(params[:file].tempfile)
        if exif_obj.exif?
          exif_hash = exif_obj.exif.to_hash
          exif = "#{exif_hash[:make]} #{exif_hash[:model]} #{exif_hash[:focal_length].to_f}mm f#{exif_hash[:f_number].to_f} #{exif_hash[:exposure_time]}s iso#{exif_hash[:iso_speed_ratings]}"
        end

        #要上传的空间
        bucket = 'www-6mao-wang'
        #上传到七牛后保存的文件名
        key = "photos/#{Time.now.to_i}-#{params[:name]}"
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
        Qiniu.upload_file uptoken: uptoken, file: tempfile.path, bucket: bucket, key: key
        file_url = "#{$base_qiniu_url}#{key}"

        # bucket = $OSS_Client.get_bucket('6mao')
        # filename = "photos/#{params[:name]}-#{Time.now.to_i}.jpg"
        # bucket.put_object(filename, :file => tempfile)
        # file_url = URI.decode(bucket.object_url(filename, false))
        # file_url = 'https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/bd_logo1_31bdc765.png'

        # FileUtils.cp tempfile.path, "/datadisk/6maowang/public/photos/#{params[:name]}-#{Time.now.to_i}.jpg"
        # file_url = "/photos/#{params[:name]}-#{Time.now.to_i}.jpg"

        photo = Photo.create(title: params[:name],
                     url: "#{file_url}",
                     description: '',
                     exif: exif,
                     gallery_id: params[:gallery_id])
        photo.gallery.updated_at = Time.now
        photo.gallery.save
        result = '
          <tr>
            <td>'+photo.title.to_s+'</td>
            <td>
              <div>
                <img height="100" src="'+photo.url.to_s+'-view"/>
              </div>
            </td>
            <td>
              <div id="alert-'+photo.id.to_s+'" class="alert alert-info hidden" role="alert"></div>
              <textarea class="form-control" rows="3" id="description-'+photo.id.to_s+'">'+photo.description.to_s+'</textarea>
              <button class="btn btn-default btn-xs btn-block" type="button" onclick="saveDescription('+photo.id.to_s+');">Save</button>
            </td>
            <td>'+photo.exif.to_s+'</td>
            <td><a data-confirm="Are you sure?" rel="nofollow" data-method="delete" href="/photos/'+photo.id.to_s+'">Destroy</a></td>
          </tr>
'
        render plain: result
      rescue Exception => e
        raise e
      end
    end
  end
end

