class Photo < ApplicationRecord
  belongs_to :gallery, touch: true
end
