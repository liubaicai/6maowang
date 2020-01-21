class Gallery < ApplicationRecord
  has_many :photos, dependent: :destroy

  def photos_count
    Photo.where(gallery_id: id).count
  end

end
