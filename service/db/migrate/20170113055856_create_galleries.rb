class CreateGalleries < ActiveRecord::Migration[4.2]
  def change
    create_table :galleries do |t|
      t.string :title, null: false
      t.string :cover, null: false
      t.string :description, default: ''

      t.timestamps null: false
    end
  end
end
