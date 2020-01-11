class CreateSettings < ActiveRecord::Migration[6.0]
  def change
    create_table :settings do |t|
      t.string :password
      t.string :qiniu_base_url
      t.string :qiniu_access_key
      t.string :qiniu_secret_key

      t.timestamps
    end
  end
end
