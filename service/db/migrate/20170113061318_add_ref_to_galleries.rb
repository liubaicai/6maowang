class AddRefToGalleries < ActiveRecord::Migration[4.2]
  def change
    add_reference :photos, :gallery, index: true, foreign_key: true
  end
end