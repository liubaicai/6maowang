class CreatePhotos < ActiveRecord::Migration
  def change
    create_table :photos do |t|
      t.string :title, null: false
      t.string :url, null: false
      t.string :description, default: ''
      t.string :exif, default: ''

      t.timestamps null: false
    end
  end
end
