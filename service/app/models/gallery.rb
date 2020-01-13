class Gallery < ApplicationRecord
  has_many :photos

  def photos_count
    Photo.where(gallery_id: id).count
  end

end
