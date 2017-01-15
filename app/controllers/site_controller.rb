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
    Settings.set('qiniu','base_url',params[:qn_base_url])
    Settings.set('qiniu','access_key',params[:qn_access_key])
    Settings.set('qiniu','secret_key',params[:qn_secret_key])
    Settings.set('aliyun','access_key_id',params[:access_key_id])
    Settings.set('aliyun','access_key_secret',params[:access_key_secret])
    Settings.set('aliyun','endpoint',params[:endpoint])
    Settings.save_config
    redirect_to :back
  end

  def upload
    unless params[:file] && (tempfile = params[:file].tempfile)
      raise Exception
    else
      begin
        exif_obj = EXIFR::JPEG.new(params[:file].tempfile)
        if exif_obj.exif?
          exif_hash = exif_obj.exif.to_hash
          exif = "#{exif_hash[:make]} #{exif_hash[:model]} #{exif_hash[:focal_length_in_35mm_film]}mm f#{exif_hash[:f_number].to_f} #{exif_hash[:exposure_time]}s iso#{exif_hash[:iso_speed_ratings]}"
        end

        bucket = $OSS_Client.get_bucket('6mao')
        filename = "photos/#{params[:name]}-#{Time.now.to_i}.jpg"
        bucket.put_object(filename, :file => tempfile)
        file_url = URI.decode(bucket.object_url(filename, false))
        #file_url = 'https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/bd_logo1_31bdc765.png'

        photo = Photo.create(title: params[:name],
                     url: file_url,
                     description: '',
                     exif: exif,
                     gallery_id: params[:gallery_id])
        result = '
            <tr>
              <td>'+photo.title.to_s+'</td>
              <td>'+photo.url.to_s+'</td>
              <td>'+photo.description.to_s+'</td>
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

