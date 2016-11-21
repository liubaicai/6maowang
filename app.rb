#encoding : UTF-8

class Gallery < ActiveRecord::Base
  has_many :photos
end

class Photo < ActiveRecord::Base
  belongs_to :gallery
end

use Rack::Session::Pool, :expire_after => 2592000
$page_size = 12

after do
  ActiveRecord::Base.connection.close
end

get '/' do
  @galleries = Gallery.order("created_at DESC").limit($page_size)
  t_count = Gallery.count
  @pre_no = ""
  @pre_class = "class=\"disabled\""
  if t_count > $page_size
    @nxt_no = "href=\"/page/2\""
    @nxt_class = ""
  else
    @nxt_no = ""
    @nxt_class = "class=\"disabled\""
  end
  erb :'index'
end

get '/galleries/:id' do
  "Hello World"
end