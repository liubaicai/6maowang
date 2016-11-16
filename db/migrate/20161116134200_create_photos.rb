class CreatePhotos < ActiveRecord::Migration
  def change
    create_table :photos do |t|
      t.string :title, null:false
      t.text :description, :default => ''
      t.string :url, null:false
      t.string :exif, :default => ''
      # make厂商 model型号 date_time_original原始时间
      # exposure_time曝光时间 f_number光圈
      # iso_speed_ratingsISO focal_length焦距
      t.timestamps null: false
    end

    add_column :photos, :gallery_id, :integer
  end
end