class ChangeGalleryCoverCanBeNull < ActiveRecord::Migration[6.0]
  def change
    change_column :galleries, :cover, :string, :null => true
  end
end
