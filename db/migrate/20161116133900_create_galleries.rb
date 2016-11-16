class CreateGalleries < ActiveRecord::Migration
  def change
    create_table :galleries do |t|
      t.string :title, null:false
      t.text :description, :default => ''
      t.timestamps null: false
    end
  end
end