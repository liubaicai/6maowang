class AddRefToGalleries < ActiveRecord::Migration
  def change
    add_reference :photos, :gallery, index: true, foreign_key: true
  end
end
