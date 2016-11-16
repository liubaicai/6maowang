#encoding : UTF-8

class Gallery < ActiveRecord::Base
  has_many :photos
end

class Photo < ActiveRecord::Base
  belongs_to :gallery
end

get '/' do
  @test = 'galleries :'+Gallery.count.to_s+',photos :'+Photo.count.to_s
  erb :'index'
end